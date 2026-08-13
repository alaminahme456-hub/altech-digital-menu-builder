import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.businessId || !body.eventType) {
      return NextResponse.json(
        { error: 'businessId and eventType are required' },
        { status: 400 }
      );
    }

    const validEventTypes = ['view', 'qr_scan', 'item_view', 'category_view'];
    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    await db.analytics.create({
      data: {
        businessId: body.businessId,
        eventType: body.eventType,
        itemId: body.itemId || null,
        categoryId: body.categoryId || null,
        referrer: request.headers.get('referer') || null,
        userAgent: request.headers.get('user-agent') || null,
        ipAddress: getClientIp(request),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
