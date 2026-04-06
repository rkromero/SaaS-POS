import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { expenseSchema } from '@/models/Schema';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db
    .delete(expenseSchema)
    .where(
      and(
        eq(expenseSchema.id, Number(params.id)),
        eq(expenseSchema.organizationId, orgId),
      ),
    );

  return NextResponse.json({ success: true });
}
