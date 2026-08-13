import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import path from 'path'
import crypto from 'crypto'

async function verifyMembership(userId: string, businessId: string): Promise<boolean> {
  const membership = await db.businessMember.findUnique({
    where: { userId_businessId: { userId, businessId } },
  })
  return !!membership
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as Record<string, unknown>).userId as string
    const { id } = await params

    const hasAccess = await verifyMembership(userId, id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, webp, pdf' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Save the file
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'pdf'
    const filename = `scan_${id}_${crypto.randomUUID()}.${ext}`
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'food', filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { writeFile, mkdir } = await import('fs/promises')
    await mkdir(path.join(process.cwd(), 'public', 'uploads', 'food'), { recursive: true })
    await writeFile(filePath, buffer)

    const imageUrl = `/uploads/food/${filename}`

    // Perform AI vision analysis on the server side
    let detectedItems: Array<{ name: string; description: string; price: number; category: string }> = []

    try {
      if (file.type.startsWith('image/')) {
        // Convert image to base64 for AI vision
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataUrl = `data:${mimeType};base64,${base64}`

        // Use z-ai-web-dev-sdk on the server
        const { createVlm } = await import('z-ai-web-dev-sdk')
        const vlm = createVlm({ apiKey: process.env.ZAI_API_KEY || '' })

        const result = await vlm.chat({
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this restaurant menu image. Extract all menu items. For each item, provide: name, description (brief), price (numeric only, handle Nigerian Naira ₦ symbol and any currency), and category. Return ONLY a valid JSON array of objects with fields: name, description, price (number, no currency symbol), category. If you cannot determine a field, use empty string for text or 0 for price. Example: [{"name":"Chicken Burger","description":"Crispy chicken patty with lettuce","price":4500,"category":"Burgers"}]. Return at least the item names and prices if visible.' },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }]
        })

        const content = result?.choices?.[0]?.message?.content || '[]'
        const jsonMatch = content.match(/[\[\s\S]*\]/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            if (Array.isArray(parsed)) {
              detectedItems = parsed.map((item: any) => ({
                name: String(item.name || ''),
                description: String(item.description || ''),
                price: Number(item.price) || 0,
                category: String(item.category || 'General'),
              })).filter((item: any) => item.name.trim())
            }
          } catch {
            console.error('Failed to parse AI response JSON')
          }
        }
      }
    } catch (aiError) {
      console.error('AI scanning error:', aiError)
      // Don't fail the request - return empty results and let user know
    }

    // Log the scan
    await db.aiScanLog.create({
      data: {
        userId,
        businessId: id,
        imageUrl,
        result: JSON.stringify(detectedItems),
        itemCount: detectedItems.length,
      },
    })

    return NextResponse.json({
      imageUrl,
      items: detectedItems,
      itemCount: detectedItems.length,
    })
  } catch (error) {
    console.error('AI scan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
