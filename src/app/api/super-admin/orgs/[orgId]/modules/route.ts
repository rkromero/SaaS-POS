import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { orgModuleSchema } from '@/models/Schema';

// GET /api/super-admin/orgs/[orgId]/modules — módulos activos del cliente
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId } = await params;
  const rows = await db
    .select()
    .from(orgModuleSchema)
    .where(eq(orgModuleSchema.orgId, orgId));

  return NextResponse.json(rows.map(r => r.moduleName));
}

// POST /api/super-admin/orgs/[orgId]/modules — activar un módulo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId } = await params;
  const { moduleName } = await request.json() as { moduleName: string };

  if (!moduleName) {
    return NextResponse.json({ error: 'moduleName es requerido' }, { status: 400 });
  }

  // INSERT OR IGNORE (unique constraint handles duplicates)
  await db
    .insert(orgModuleSchema)
    .values({ orgId, moduleName, enabledByUserId: userId })
    .onConflictDoNothing();

  return NextResponse.json({ success: true, moduleName });
}
