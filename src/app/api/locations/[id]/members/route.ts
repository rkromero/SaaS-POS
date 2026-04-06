import { auth, clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { locationSchema, userLocationSchema } from '@/models/Schema';

// GET /api/locations/[id]/members — list members assigned to this location
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locationId = Number(params.id);

  // Verify location belongs to org
  const [location] = await db
    .select()
    .from(locationSchema)
    .where(and(eq(locationSchema.id, locationId), eq(locationSchema.organizationId, orgId)));

  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Get assigned user IDs
  const assignments = await db
    .select()
    .from(userLocationSchema)
    .where(eq(userLocationSchema.locationId, locationId));

  // Get org members from Clerk
  const client = await clerkClient();
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });

  const members = memberships.data.map((m) => {
    const user = m.publicUserData;
    const assigned = assignments.find(a => a.userId === user?.userId);
    return {
      userId: user?.userId ?? '',
      name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.identifier,
      email: user?.identifier,
      imageUrl: user?.imageUrl,
      role: m.role,
      assignedToThisLocation: !!assigned,
      assignmentId: assigned?.id ?? null,
    };
  });

  return NextResponse.json(members);
}

// POST /api/locations/[id]/members — assign a user to this location
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locationId = Number(params.id);
  const { targetUserId } = await request.json();

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  // Verify location belongs to org
  const [location] = await db
    .select()
    .from(locationSchema)
    .where(and(eq(locationSchema.id, locationId), eq(locationSchema.organizationId, orgId)));

  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  // Remove any existing assignment for this user (one user = one location)
  await db
    .delete(userLocationSchema)
    .where(eq(userLocationSchema.userId, targetUserId));

  // Create new assignment
  const [assignment] = await db
    .insert(userLocationSchema)
    .values({ userId: targetUserId, locationId })
    .returning();

  return NextResponse.json(assignment, { status: 201 });
}

// DELETE /api/locations/[id]/members — remove assignment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locationId = Number(params.id);
  const { targetUserId } = await request.json();

  await db
    .delete(userLocationSchema)
    .where(
      and(
        eq(userLocationSchema.userId, targetUserId),
        eq(userLocationSchema.locationId, locationId),
      ),
    );

  return NextResponse.json({ success: true });
}
