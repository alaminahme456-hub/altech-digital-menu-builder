'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore, useDesignStore } from '@/lib/stores'
import { categoryApi, designApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Smartphone,
  Monitor,
  Maximize,
  MessageCircle,
  UtensilsCrossed,
  ImageIcon,
} from 'lucide-react'

// ===== Types =====
interface PreviewCategory {
  id: string
  name: string
  items: PreviewItem[]
}

interface PreviewItem {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  isHidden: boolean
}

interface DesignData {
  primaryColor: string
  secondaryColor: string
  fontStyle: string
  backgroundStyle: string
  logoPosition: string
  menuLayout: string
  whatsappEnabled: boolean
  whatsappNumber: string
}

type PreviewMode = 'mobile' | 'desktop' | 'fullscreen'

// ===== Font Mapping =====
const fontFamilies: Record<string, string> = {
  modern: "'Inter', system-ui, sans-serif",
  classic: "'Georgia', serif",
  playful: "'Nunito', 'Comic Sans MS', cursive",
  minimal: "'Helvetica Neue', 'Arial', sans-serif",
}

// ===== Menu Preview Content =====
function MenuPreviewContent({
  categories,
  design,
  businessName,
  businessDescription,
  businessLogo,
}: {
  categories: PreviewCategory[]
  design: DesignData
  businessName: string
  businessDescription: string | null
  businessLogo: string | null
}) {
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id || ''
  )

  const activeItems =
    categories.find((c) => c.id === activeCategory)?.items.filter((i) => !i.isHidden) || []

  const isLight = design.backgroundStyle === 'light'
  const bg = isLight ? '#ffffff' : '#1a1a2e'
  const fg = isLight ? '#111827' : '#f9fafb'
  const muted = isLight ? '#6b7280' : '#9ca3af'
  const cardBg = isLight ? '#f9fafb' : '#16213e'
  const fontFamily = fontFamilies[design.fontStyle] || fontFamilies.modern

  return (
    <div
      style={{
        fontFamily,
        backgroundColor: bg,
        color: fg,
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 16px 16px', textAlign: 'center' }}>
        {businessLogo && (
          <img
            src={businessLogo}
            alt={businessName}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 10px',
              border: `2px solid ${design.secondaryColor}`,
            }}
          />
        )}
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: design.primaryColor,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {businessName}
        </h1>
        {businessDescription && (
          <p
            style={{
              fontSize: 12,
              color: muted,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {businessDescription}
          </p>
        )}
      </div>

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '0 16px 12px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: cat.id === activeCategory ? design.secondaryColor : cardBg,
                color: cat.id === activeCategory ? '#ffffff' : muted,
                transition: 'all 0.2s',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu Items */}
      <div style={{ padding: '0 16px 16px' }}>
        {design.menuLayout === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {activeItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `1px solid ${isLight ? '#f3f4f6' : '#1e293b'}`,
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 80,
                      backgroundColor: isLight ? '#e5e7eb' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageIcon
                      style={{
                        width: 24,
                        height: 24,
                        color: isLight ? '#9ca3af' : '#475569',
                      }}
                    />
                  </div>
                )}
                <div style={{ padding: '8px 10px 10px' }}>
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>
                  {item.description && (
                    <p
                      style={{
                        fontSize: 10,
                        color: muted,
                        margin: '3px 0 0',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: design.secondaryColor,
                      margin: '5px 0 0',
                    }}
                  >
                    ₦{item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  padding: 10,
                  border: `1px solid ${isLight ? '#f3f4f6' : '#1e293b'}`,
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      backgroundColor: isLight ? '#e5e7eb' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ImageIcon
                      style={{
                        width: 20,
                        height: 20,
                        color: isLight ? '#9ca3af' : '#475569',
                      }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>
                  {item.description && (
                    <p
                      style={{
                        fontSize: 11,
                        color: muted,
                        margin: '3px 0 0',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: design.secondaryColor,
                      margin: '6px 0 0',
                    }}
                  >
                    ₦{item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeItems.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: muted,
            }}
          >
            <UtensilsCrossed
              style={{
                width: 32,
                height: 32,
                margin: '0 auto 8px',
                opacity: 0.4,
              }}
            />\n            <p style={{ fontSize: 13 }}>No items in this category</p>
          </div>
        )}
      </div>

      {/* WhatsApp Button */}
      {design.whatsappEnabled && design.whatsappNumber && (
        <div style={{ padding: '8px 16px 24px' }}>
          <button
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#25D366',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <MessageCircle style={{ width: 18, height: 18 }} />
            Order on WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}

// ===== Phone Frame =====
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 'fit-content' }}>
      {/* Phone outer shell */}
      <div
        className="rounded-[40px] border-[6px] border-gray-800 bg-gray-800 overflow-hidden"
        style={{
          width: 375,
          height: 812,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 2px #374151',
        }}
      >
        {/* Notch */}
        <div className="relative">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
            style={{
              width: 150,
              height: 28,
              backgroundColor: '#1f2937',
              borderRadius: '0 0 18px 18px',
            }}
          />
        </div>
        {/* Screen */}
        <div
          className="overflow-y-auto overflow-x-hidden"
          style={{ height: 800 }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ===== Desktop Frame =====
function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1024px]">
      <div
        className="rounded-xl border border-gray-300 bg-white overflow-hidden"
        style={{
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200"
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 font-mono w-64 text-center truncate">
              menuqr.app/menu/your-business
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ===== Main PreviewPage Component =====
export function PreviewPage() {
  const { currentBusiness } = useAuthStore()
  const { setDesign } = useDesignStore()

  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile')
  const [categories, setCategories] = useState<PreviewCategory[]>([])
  const [design, setDesignLocal] = useState<DesignData>({
    primaryColor: '#1a1a2e',
    secondaryColor: '#e94560',
    fontStyle: 'modern',
    backgroundStyle: 'light',
    logoPosition: 'top-center',
    menuLayout: 'grid',
    whatsappEnabled: false,
    whatsappNumber: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const businessId = currentBusiness?.id
  const businessName = currentBusiness?.name || 'Your Business'
  const businessDescription = currentBusiness?.description
  const businessLogo = currentBusiness?.logoUrl

  const fetchData = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [categoriesData, designData] = await Promise.allSettled([
        categoryApi.list(businessId),
        designApi.get(businessId),
      ])

      if (categoriesData.status === 'fulfilled') {
        setCategories(categoriesData.value)
      }

      if (designData.status === 'fulfilled' && designData.value) {
        const d = designData.value
        setDesignLocal({
          primaryColor: d.primaryColor || '#1a1a2e',
          secondaryColor: d.secondaryColor || '#e94560',
          fontStyle: d.fontStyle || 'modern',
          backgroundStyle: d.backgroundStyle || 'light',
          logoPosition: d.logoPosition || 'top-center',
          menuLayout: d.menuLayout || 'grid',
          whatsappEnabled: d.whatsappEnabled || false,
          whatsappNumber: d.whatsappNumber || '',
        })
        // Also sync to store
        setDesign({
          primaryColor: d.primaryColor || '#1a1a2e',
          secondaryColor: d.secondaryColor || '#e94560',
          fontStyle: d.fontStyle || 'modern',
          backgroundStyle: d.backgroundStyle || 'light',
          logoPosition: d.logoPosition || 'top-center',
          menuLayout: d.menuLayout || 'grid',
          whatsappEnabled: d.whatsappEnabled || false,
          whatsappNumber: d.whatsappNumber || '',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview data')
    } finally {
      setLoading(false)
    }
  }, [businessId, setDesign])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const previewContent = (
    <MenuPreviewContent
      categories={categories}
      design={design}
      businessName={businessName}
      businessDescription={businessDescription}
      businessLogo={businessLogo}
    />
  )

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Menu Preview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            See how your digital menu looks to customers
          </p>
        </div>

        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
            className={`gap-1.5 text-xs h-8 ${
              previewMode === 'mobile'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-muted-foreground'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </Button>
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
            className={`gap-1.5 text-xs h-8 ${
              previewMode === 'desktop'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-muted-foreground'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </Button>
          <Button
            variant={previewMode === 'fullscreen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('fullscreen')}
            className={`gap-1.5 text-xs h-8 ${
              previewMode === 'fullscreen'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-muted-foreground'
            }`}
          >
            <Maximize className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Full Screen</span>
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="space-y-4 w-full max-w-sm">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-[500px] w-[280px] rounded-[32px] mx-auto" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
              <Smartphone className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Failed to load preview</h3>
            <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-sm">
              {error}
            </p>
            <Button
              onClick={fetchData}
              className="mt-5 bg-[#e94560] hover:bg-[#d13050] text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gray-100 mb-4">
              <UtensilsCrossed className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No menu items yet</h3>
            <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-sm">
              Add categories and items to your menu to see a preview here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile & Desktop inline preview */}
          {previewMode !== 'fullscreen' && (
            <div className="flex justify-center py-4">
              <div className="bg-gray-50 rounded-2xl p-6 md:p-10">
                {previewMode === 'mobile' ? (
                  <PhoneFrame>{previewContent}</PhoneFrame>
                ) : (
                  <DesktopFrame>{previewContent}</DesktopFrame>
                )}
              </div>
            </div>
          )}

          {/* Fullscreen Dialog */}
          <Dialog
            open={previewMode === 'fullscreen'}
            onOpenChange={(open) => {
              if (!open) setPreviewMode('mobile')
            }}
          >
            <DialogContent
              className="w-[100vw] h-[100vh] max-w-none max-h-none rounded-none p-0 m-0 translate-x-0 translate-y-0"
              showCloseButton={true}
            >
              <DialogTitle className="sr-only">Full Screen Menu Preview</DialogTitle>
              <DialogDescription className="sr-only">
                Full screen preview of your digital menu as customers will see it.
              </DialogDescription>
              <div className="w-full h-full overflow-hidden">
                <ScrollArea className="h-full w-full">
                  <div className="max-w-lg mx-auto">
                    {previewContent}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
