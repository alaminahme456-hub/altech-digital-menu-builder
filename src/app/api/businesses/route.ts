import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'business'
}

async function ensureUniqueSlug(name: string): Promise<string> {
  let slug = generateSlug(name)
  const exists = await db.business.findUnique({ where: { slug } })
  if (!exists) return slug

  const suffix = crypto.randomBytes(2).toString('hex')
  slug = `${generateSlug(name)}-${suffix}`
  const existsAgain = await db.business.findUnique({ where: { slug } })
  if (!existsAgain) return slug

  return `${generateSlug(name)}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as Record<string, unknown>).userId as string

    // Handle FormData (file upload) or JSON
    let name = ''
    let category = 'restaurant'
    let phone: string | undefined
    let whatsapp: string | undefined
    let address: string | undefined
    let description: string | undefined
    let openingHours: string | undefined
    let logoUrl: string | undefined

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      name = (formData.get('name') as string) || ''
      category = (formData.get('category') as string) || 'restaurant'
      phone = (formData.get('phone') as string) || undefined
      whatsapp = (formData.get('whatsapp') as string) || undefined
      address = (formData.get('address') as string) || undefined
      description = (formData.get('description') as string) || undefined
      openingHours = (formData.get('openingHours') as string) || undefined

      // Handle logo upload
      const logoFile = formData.get('logo') as File | null
      if (logoFile && logoFile.size > 0) {
        const ext = logoFile.name.split('.').pop() || 'png'
        const fileName = `logo_${Date.now()}_${crypto.randomUUID()}.${ext}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
        await mkdir(uploadDir, { recursive: true })
        const filePath = path.join(uploadDir, fileName)
        const bytes = await logoFile.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))
        logoUrl = `/uploads/logos/${fileName}`
      }
    } else {
      const body = await request.json()
      name = body.name || ''
      category = body.category || 'restaurant'
      phone = body.phone
      whatsapp = body.whatsapp
      address = body.address
      description = body.description
      openingHours = body.openingHours
      logoUrl = body.logoUrl
    }

    if (!name.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const slug = await ensureUniqueSlug(name)

    const business = await db.business.create({
      data: {
        name: name.trim(),
        slug,
        category,
        phone: phone || null,
        whatsapp: whatsapp || null,
        address: address || null,
        description: description || null,
        openingHours: openingHours || null,
        logoUrl: logoUrl || null,
      },
    })

    await db.businessMember.create({
      data: {
        userId,
        businessId: business.id,
        role: 'owner',
      },
    })

    return NextResponse.json({ business }, { status: 201 })
  } catch (error) {
    console.error('Create business error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as Record<string, unknown>).userId as string

    const memberships = await db.businessMember.findMany({
      where: { userId },
      include: {
        business: {
          include: {
            _count: {
              select: {
                menuCategories: true,
                analytics: true,
              },
            },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
    })

    const businesses = memberships.map((m) => ({
      ...m.business,
      memberRole: m.role,
      joinedAt: m.joinedAt,
    }))

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error('List businesses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
