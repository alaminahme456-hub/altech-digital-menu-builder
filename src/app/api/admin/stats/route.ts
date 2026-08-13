import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalBusinesses,
      publishedMenus,
      totalScans,
      newUsersThisMonth,
      newBusinessesThisMonth,
    ] = await Promise.all([
      db.user.count(),
      db.business.count({ where: { status: 'active' } }),
      db.menuUpload.count({ where: { status: 'published' } }),
      db.analytics.count({ where: { eventType: 'qr_scan' } }),
      db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.business.count({
        where: { status: 'active', createdAt: { gte: startOfMonth } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalBusinesses,
        publishedMenus,
        totalScans,
        newUsersThisMonth,
        newBusinessesThisMonth,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
