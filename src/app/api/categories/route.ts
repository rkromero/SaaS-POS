import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { categorySchema } from '@/models/Schema';

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await db
    .select()
    .from(categorySchema)
    .where(eq(categorySchema.organizationId, orgId))
    .orderBy(categorySchema.name);

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
  }

  const [category] = await db
    .insert(categorySchema)
    .values({ organizationId: orgId, name: name.trim() })
    .returning();

  return NextResponse.json(category, { status: 201 });
}
