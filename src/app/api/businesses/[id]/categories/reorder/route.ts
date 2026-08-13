import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

async function verifyMembership(userId: string, businessId: string): Promise<boolean> {
  const membership = await db.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
  return !!membership;
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
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify all category IDs belong to this business
    const categoryIds = parsed.data.items.map((item) => item.id);
    const categoriesCount = await db.menuCategory.count({
      where: { id: { in: categoryIds }, businessId: id },
    });

    if (categoriesCount !== categoryIds.length) {
      return NextResponse.json(
        { error: 'Some categories do not belong to this business' },
        { status: 400 }
      );
    }

    // Update sort orders in a transaction
    await db.$transaction(
      parsed.data.items.map((item) =>
        db.menuCategory.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
