import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import QRCode from 'qrcode';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    const business = await db.business.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/menu/${business.slug}`;

    // Check for existing QR code
    const existingQr = await db.qrCode.findUnique({
      where: { businessId: id },
    });

    if (existingQr && existingQr.pngUrl) {
      return NextResponse.json({
        qrCode: existingQr,
        url: menuUrl,
      });
    }

    // Generate new QR code
    const filename = `qr-${uuidv4()}.png`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'qrcodes', filename);

    await QRCode.toFile(filePath, menuUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    const pngDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    const svgString = await QRCode.toString(menuUrl, {
      type: 'svg',
      width: 1024,
      margin: 2,
      errorCorrectionLevel: 'H',
    });

    const pngUrl = `/uploads/qrcodes/${filename}`;

    const qrCode = await db.qrCode.upsert({
      where: { businessId: id },
      update: {
        slug: business.slug,
        pngUrl,
        svgUrl: svgString,
      },
      create: {
        businessId: id,
        slug: business.slug,
        pngUrl,
        svgUrl: svgString,
      },
    });

    return NextResponse.json({
      qrCode,
      url: menuUrl,
      pngDataUrl,
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
