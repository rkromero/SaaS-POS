import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { expenseSchema, locationSchema, userLocationSchema } from '@/models/Schema';

// GET /api/expenses?from=&to=
export async function GET(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let locationId: number | null = null;
  if (orgRole !== 'org:admin') {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json([]);
    }
    locationId = assignment.locationId;
  }

  const conditions = [eq(expenseSchema.organizationId, orgId)];
  if (locationId) {
    conditions.push(eq(expenseSchema.locationId, locationId));
  }
  if (from) {
    conditions.push(gte(expenseSchema.date, new Date(from)));
  }
  if (to) {
    conditions.push(lte(expenseSchema.date, new Date(to)));
  }

  const expenses = await db
    .select()
    .from(expenseSchema)
    .where(and(...conditions))
    .orderBy(desc(expenseSchema.date));

  return NextResponse.json(expenses);
}

// POST /api/expenses
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { amount, description, category, date, locationId: bodyLocationId } = body;

  if (!amount || !description || !category) {
    return NextResponse.json({ error: 'amount, description y category son requeridos' }, { status: 400 });
  }

  let resolvedLocationId: number;
  if (orgRole === 'org:admin' && bodyLocationId) {
    resolvedLocationId = Number(bodyLocationId);
  } else {
    const [assignment] = await db
      .select({ locationId: userLocationSchema.locationId })
      .from(userLocationSchema)
      .where(eq(userLocationSchema.userId, userId));
    if (!assignment) {
      return NextResponse.json({ error: 'Sin local asignado' }, { status: 403 });
    }
    resolvedLocationId = assignment.locationId;
  }

  const [location] = await db
    .select()
    .from(locationSchema)
    .where(and(eq(locationSchema.id, resolvedLocationId), eq(locationSchema.organizationId, orgId)));
  if (!location) {
    return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
  }

  const [expense] = await db
    .insert(expenseSchema)
    .values({
      organizationId: orgId,
      locationId: resolvedLocationId,
      amount: String(amount),
      description: description.trim(),
      category,
      userId,
      date: date ? new Date(date) : new Date(),
    })
    .returning();

  return NextResponse.json(expense, { status: 201 });
}
