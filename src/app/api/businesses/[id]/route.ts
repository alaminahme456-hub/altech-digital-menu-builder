import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  openingHours: z.string().optional(),
  logoUrl: z.string().optional(),
});

async function verifyMembership(
  userId: string,
  businessId: string,
  requiredRoles?: string[]
): Promise<boolean> {
  const membership = await db.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  if (!membership) return false;
  if (requiredRoles && !requiredRoles.includes(membership.role)) return false;
  return true;
}

export async function GET(
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

    const business = await db.business.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            menuCategories: true,
            analytics: true,
            menuUploads: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
        qrCode: true,
        designSettings: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
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

    const hasAccess = await verifyMembership(userId, id, ['owner', 'manager']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateBusinessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const business = await db.business.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const hasAccess = await verifyMembership(userId, id, ['owner']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.business.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return NextResponse.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
