import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { isSuperAdmin } from '@/libs/SuperAdmin';
import { orgModuleSchema } from '@/models/Schema';

// DELETE /api/super-admin/orgs/[orgId]/modules/[module] — desactivar un módulo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; module: string }> },
) {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orgId, module: moduleName } = await params;

  await db
    .delete(orgModuleSchema)
    .where(
      and(
        eq(orgModuleSchema.orgId, orgId),
        eq(orgModuleSchema.moduleName, moduleName),
      ),
    );

  return NextResponse.json({ success: true });
}
