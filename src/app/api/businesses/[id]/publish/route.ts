import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const publishSchema = z.object({
  uploadId: z.string(),
  status: z.enum(['draft', 'published', 'unpublished']),
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
    const parsed = publishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const upload = await db.menuUpload.findFirst({
      where: { id: parsed.data.uploadId, businessId: id },
    });

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    const updated = await db.menuUpload.update({
      where: { id: parsed.data.uploadId },
      data: { status: parsed.data.status },
    });

    // If publishing, unpublish other uploads for this business
    if (parsed.data.status === 'published') {
      await db.menuUpload.updateMany({
        where: {
          businessId: id,
          id: { not: parsed.data.uploadId },
          status: 'published',
        },
        data: { status: 'unpublished' },
      });
    }

    return NextResponse.json({ upload: updated });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
