import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch business by slug (active or unpublished, but not deleted/suspended)
    const business = await db.business.findUnique({
      where: { slug },
      include: {
        designSettings: true,
        menuUploads: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        menuCategories: {
          where: { isHidden: false },
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              where: { isHidden: false },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!business || business.status === 'deleted' || business.status === 'suspended') {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    // Track the view asynchronously (fire and forget)
    if (business.status === 'active') {
      const referrer = request.headers.get('referer') || null;
      const userAgent = request.headers.get('user-agent') || null;
      const forwarded = request.headers.get('x-forwarded-for');
      const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

      db.analytics.create({
        data: {
          businessId: business.id,
          eventType: 'view',
          referrer,
          userAgent,
          ipAddress,
        },
      }).catch(() => {
        // Silently fail - analytics should not break the menu
      });
    }

    // Build the response in the expected format
    const { menuUploads, designSettings, menuCategories, ...businessData } = business;

    const design = designSettings || {
      templateId: null,
      primaryColor: '#1a1a2e',
      secondaryColor: '#e94560',
      fontStyle: 'modern',
      backgroundStyle: 'light',
      logoPosition: 'top-center',
      menuLayout: 'grid',
      whatsappEnabled: false,
      whatsappNumber: null,
      seoEnabled: true,
    };

    // Get the latest upload if it exists
    const upload = menuUploads.length > 0 ? menuUploads[0] : null;

    return NextResponse.json({
      business: {
        id: businessData.id,
        name: businessData.name,
        slug: businessData.slug,
        category: businessData.category,
        logoUrl: businessData.logoUrl,
        phone: businessData.phone,
        whatsapp: businessData.whatsapp,
        address: businessData.address,
        description: businessData.description,
        openingHours: businessData.openingHours,
        status: businessData.status,
        plan: businessData.plan,
      },
      categories: menuCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
        isHidden: cat.isHidden,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          sortOrder: item.sortOrder,
          isAvailable: item.isAvailable,
          isHidden: item.isHidden,
        })),
      })),
      design,
      upload: upload ? {
        id: upload.id,
        fileUrl: upload.fileUrl,
        fileType: upload.fileType,
        status: upload.status,
      } : null,
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
