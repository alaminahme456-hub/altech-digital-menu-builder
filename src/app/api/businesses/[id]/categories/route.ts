import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  isHidden: z.boolean().default(false),
});

async function verifyMembership(userId: string, businessId: string): Promise<boolean> {
  const membership = await db.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  return !!membership;
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

    const categories = await db.menuCategory.findMany({
      where: { businessId: id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get the max sort order to append at the end
    const maxSort = await db.menuCategory.findFirst({
      where: { businessId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const category = await db.menuCategory.create({
      data: {
        name: parsed.data.name,
        businessId: id,
        isHidden: parsed.data.isHidden,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
      include: { items: true },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
