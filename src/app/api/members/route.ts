import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// GET /api/members — list all members of the current org
export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = await clerkClient();
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 200,
  });

  const members = memberships.data.map((m) => {
    const user = m.publicUserData;
    return {
      userId: user?.userId ?? '',
      name: (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || (user?.identifier ?? ''),
      email: user?.identifier ?? '',
      imageUrl: user?.imageUrl ?? '',
      role: m.role,
    };
  });

  return NextResponse.json(members);
}
