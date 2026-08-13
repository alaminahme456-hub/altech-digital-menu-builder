import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateDesignSchema = z.object({
  templateId: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontStyle: z.string().optional(),
  backgroundStyle: z.string().optional(),
  logoPosition: z.string().optional(),
  menuLayout: z.string().optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappNumber: z.string().optional(),
  seoEnabled: z.boolean().optional(),
});

async function verifyMembership(userId: string, businessId: string): Promise<boolean> {
  const membership = await db.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  return !!membership;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).userId as string;
    const { id } = await params;

    const hasAccess = await verifyMembership(userId, id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let designSettings = await db.designSetting.findUnique({
      where: { businessId: id },
    });

    // Create default settings if they don't exist
    if (!designSettings) {
      designSettings = await db.designSetting.create({
        data: { businessId: id },
      });
    }

    return NextResponse.json({ designSettings });
  } catch (error) {
    console.error('Get design settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).userId as string;
    const { id } = await params;

    const hasAccess = await verifyMembership(userId, id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateDesignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const designSettings = await db.designSetting.upsert({
      where: { businessId: id },
      update: parsed.data,
      create: {
        businessId: id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ designSettings });
  } catch (error) {
    console.error('Update design settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
