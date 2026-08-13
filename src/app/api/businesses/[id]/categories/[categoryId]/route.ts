import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isHidden: z.boolean().optional(),
});

async function verifyMembership(userId: string, businessId: string): Promise<boolean> {
  const membership = await db.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  return !!membership;
}

export async function PUT(
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

    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const category = await db.menuCategory.findFirst({
      where: { id: categoryId, businessId: id },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updated = await db.menuCategory.update({
      where: { id: categoryId },
      data: parsed.data,
      include: { items: true },
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await db.menuItem.deleteMany({ where: { categoryId } });
    await db.menuCategory.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
