import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// POST /api/users — create a user in Clerk and add them to the current org
export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { firstName, lastName, email, password, role } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const client = await clerkClient();

  // Create the user in Clerk
  let newUser;
  try {
    newUser = await client.users.createUser({
      emailAddress: [email],
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      skipPasswordChecks: false,
    });
  } catch (err: any) {
    // Clerk returns structured errors; surface the first message
    const clerkMessage = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? 'Error al crear usuario en Clerk';
    return NextResponse.json({ error: clerkMessage }, { status: 422 });
  }

  // Add the new user as a member of the current org
  const memberRole = role === 'org:admin' ? 'org:admin' : 'org:member';
  try {
    await client.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId: newUser.id,
      role: memberRole,
    });
  } catch (err: any) {
    // User was created but membership failed — delete the orphaned user
    await client.users.deleteUser(newUser.id).catch(() => {});
    const clerkMessage = err?.errors?.[0]?.longMessage ?? 'Error al agregar el usuario a la organización';
    return NextResponse.json({ error: clerkMessage }, { status: 422 });
  }

  return NextResponse.json(
    {
      userId: newUser.id,
      email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    },
    { status: 201 },
  );
}
