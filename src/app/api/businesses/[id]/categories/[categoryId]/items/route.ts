import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
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
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).userId as string;
    const { id, categoryId } = await params;

    const hasAccess = await verifyMembership(userId, id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await db.menuCategory.findFirst({
      where: { id: categoryId, businessId: id },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const items = await db.menuItem.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('List items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).userId as string;
    const { id, categoryId } = await params;

    const hasAccess = await verifyMembership(userId, id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await db.menuCategory.findFirst({
      where: { id: categoryId, businessId: id },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const maxSort = await db.menuItem.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const item = await db.menuItem.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        imageUrl: parsed.data.imageUrl,
        isAvailable: parsed.data.isAvailable,
        isHidden: parsed.data.isHidden,
        categoryId,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
