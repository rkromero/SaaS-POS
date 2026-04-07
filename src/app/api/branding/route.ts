import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { brandingSchema, organizationSchema } from '@/models/Schema';

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [branding] = await db
    .select()
    .from(brandingSchema)
    .where(eq(brandingSchema.organizationId, orgId));

  return NextResponse.json(branding ?? null);
}

export async function PUT(request: Request) {
  const { orgId, orgRole } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (orgRole !== 'org:admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Solo planes de pago
  const [org] = await db
    .select({ planType: organizationSchema.planType })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId));

  if (!org || org.planType === 'free') {
    return NextResponse.json(
      { error: 'La personalización requiere un plan de pago' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const {
    logoUrl,
    faviconUrl,
    primaryColor,
    businessName,
    receiptShowLogo,
    receiptAddress,
    receiptPhone,
    receiptCuit,
    receiptFooter,
  } = body;

  const [result] = await db
    .insert(brandingSchema)
    .values({
      organizationId: orgId,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      primaryColor: primaryColor || null,
      businessName: businessName || null,
      receiptShowLogo: receiptShowLogo !== false,
      receiptAddress: receiptAddress || null,
      receiptPhone: receiptPhone || null,
      receiptCuit: receiptCuit || null,
      receiptFooter: receiptFooter || null,
    })
    .onConflictDoUpdate({
      target: brandingSchema.organizationId,
      set: {
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor: primaryColor || null,
        businessName: businessName || null,
        receiptShowLogo: receiptShowLogo !== false,
        receiptAddress: receiptAddress || null,
        receiptPhone: receiptPhone || null,
        receiptCuit: receiptCuit || null,
        receiptFooter: receiptFooter || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(result);
}
