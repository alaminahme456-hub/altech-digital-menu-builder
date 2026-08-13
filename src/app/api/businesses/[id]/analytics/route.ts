import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalViews,
      todayViews,
      weekViews,
      monthViews,
      qrScans,
      recentAnalytics,
      mostViewedItems,
      mostViewedCategories,
    ] = await Promise.all([
      db.analytics.count({ where: { businessId: id } }),
      db.analytics.count({
        where: { businessId: id, createdAt: { gte: startOfDay } },
      }),
      db.analytics.count({
        where: { businessId: id, createdAt: { gte: startOfWeek } },
      }),
      db.analytics.count({
        where: { businessId: id, createdAt: { gte: startOfMonth } },
      }),
      db.analytics.count({
        where: { businessId: id, eventType: 'qr_scan' },
      }),
      db.analytics.findMany({
        where: { businessId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.analytics.groupBy({
        by: ['itemId'],
        where: {
          businessId: id,
          eventType: 'item_view',
          itemId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      db.analytics.groupBy({
        by: ['categoryId'],
        where: {
          businessId: id,
          eventType: 'category_view',
          categoryId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Enrich most viewed items with names
    const itemIds = mostViewedItems.map((i) => i.itemId).filter(Boolean) as string[];
    const items = itemIds.length > 0
      ? await db.menuItem.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, name: true },
        })
      : [];
    const itemMap = new Map(items.map((i) => [i.id, i.name]));

    const enrichedItems = mostViewedItems.map((i) => ({
      itemId: i.itemId,
      name: itemMap.get(i.itemId || '') || 'Unknown',
      views: i._count.id,
    }));

    // Enrich most viewed categories with names
    const categoryIds = mostViewedCategories.map((c) => c.categoryId).filter(Boolean) as string[];
    const categories = categoryIds.length > 0
      ? await db.menuCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const enrichedCategories = mostViewedCategories.map((c) => ({
      categoryId: c.categoryId,
      name: categoryMap.get(c.categoryId || '') || 'Unknown',
      views: c._count.id,
    }));

    // Get daily views for the last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyViews = await db.analytics.groupBy({
      by: ['createdAt'],
      where: {
        businessId: id,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Aggregate by date
    const dailyMap = new Map<string, number>();
    for (const dv of dailyViews) {
      const dateKey = dv.createdAt.toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + dv._count.id);
    }

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalViews,
      todayViews,
      weekViews,
      monthViews,
      qrScans,
      recentAnalytics,
      mostViewedItems: enrichedItems,
      mostViewedCategories: enrichedCategories,
      dailyViews: dailyData,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
