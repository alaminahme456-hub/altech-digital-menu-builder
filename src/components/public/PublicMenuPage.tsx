'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/stores'
import { publicMenuApi, analyticsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { UtensilsCrossed, Phone, MapPin, MessageCircle, Search, X, Plus, Minus, ShoppingCart, ChevronUp, Clock, Loader2 } from 'lucide-react'

// ===== Types =====
interface BusinessData {
  id: string
  name: string
  slug: string
  category: string
  logoUrl: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  description: string | null
  openingHours: string | null
  status: string
  plan: string
}

interface MenuItemData {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  sortOrder: number
  isAvailable: boolean
  isHidden: boolean
}

interface CategoryData {
  id: string
  name: string
  sortOrder: number
  isHidden: boolean
  items: MenuItemData[]
}

interface DesignData {
  templateId: string | null
  primaryColor: string
  secondaryColor: string
  fontStyle: string
  backgroundStyle: string
  logoPosition: string
  menuLayout: string
  whatsappEnabled: boolean
  whatsappNumber: string | null
  seoEnabled: boolean
}

interface UploadData {
  id: string
  fileUrl: string
  fileType: string
  status: string
}

interface MenuData {
  business: BusinessData
  categories: CategoryData[]
  design: DesignData
  upload: UploadData | null
}

interface CartItem {
  itemId: string
  name: string
  price: number
  quantity: number
}

// ===== Font Mapping =====
const fontClasses: Record<string, string> = {
  modern: 'font-sans',
  classic: 'font-serif',
  playful: 'font-sans',
  minimal: 'font-sans',
}

// ===== Background Theme Helper =====
function getThemeClasses(bgStyle: string) {
  switch (bgStyle) {
    case 'dark':
      return {
        bg: 'bg-[#1a1a2e]',
        fg: 'text-gray-100',
        muted: 'text-gray-400',
        card: 'bg-[#16213e]',
        cardBorder: 'border-[#1e293b]',
        headerBg: 'bg-[#0f0f23]',
        searchBg: 'bg-[#16213e]',
        searchBorder: 'border-[#1e293b]',
        searchInput: 'text-gray-100 placeholder:text-gray-500',
        placeholder: 'bg-[#0f172a]',
        placeholderIcon: 'text-gray-600',
        tabBg: 'bg-[#16213e]',
        tabText: 'text-gray-400',
        footer: 'text-gray-500 border-[#1e293b]',
        overlay: 'bg-black/60',
      }
    case 'warm':
      return {
        bg: 'bg-[#FFF8F0]',
        fg: 'text-gray-900',
        muted: 'text-gray-500',
        card: 'bg-white',
        cardBorder: 'border-orange-100',
        headerBg: 'bg-[#FFF0E0]',
        searchBg: 'bg-white',
        searchBorder: 'border-orange-200',
        searchInput: 'text-gray-900 placeholder:text-gray-400',
        placeholder: 'bg-orange-50',
        placeholderIcon: 'text-orange-300',
        tabBg: 'bg-white',
        tabText: 'text-gray-500',
        footer: 'text-gray-400 border-orange-100',
        overlay: 'bg-black/40',
      }
    case 'cool':
      return {
        bg: 'bg-[#F0F4FF]',
        fg: 'text-gray-900',
        muted: 'text-gray-500',
        card: 'bg-white',
        cardBorder: 'border-blue-100',
        headerBg: 'bg-[#E0EAFF]',
        searchBg: 'bg-white',
        searchBorder: 'border-blue-200',
        searchInput: 'text-gray-900 placeholder:text-gray-400',
        placeholder: 'bg-blue-50',
        placeholderIcon: 'text-blue-300',
        tabBg: 'bg-white',
        tabText: 'text-gray-500',
        footer: 'text-gray-400 border-blue-100',
        overlay: 'bg-black/40',
      }
    default: // light
      return {
        bg: 'bg-white',
        fg: 'text-gray-900',
        muted: 'text-gray-500',
        card: 'bg-gray-50',
        cardBorder: 'border-gray-100',
        headerBg: 'bg-gray-50',
        searchBg: 'bg-white',
        searchBorder: 'border-gray-200',
        searchInput: 'text-gray-900 placeholder:text-gray-400',
        placeholder: 'bg-gray-100',
        placeholderIcon: 'text-gray-300',
        tabBg: 'bg-white',
        tabText: 'text-gray-500',
        footer: 'text-gray-400 border-gray-100',
        overlay: 'bg-black/40',
      }
  }
}

// ===== Helpers =====
function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`
}

function hasVisibleItems(categories: CategoryData[]): boolean {
  return categories.some((cat) => cat.items.some((item) => !item.isHidden))
}

function parseOpeningHours(hours: string | null): { isOpen: boolean; text: string } {
  if (!hours) return { isOpen: true, text: 'No hours specified' }
  try {
    const parsed = JSON.parse(hours)
    if (typeof parsed === 'string') return { isOpen: true, text: parsed }
    if (typeof parsed === 'object') {
      // Try to determine if currently open
      const now = new Date()
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const todayName = dayNames[now.getDay()]
      const todayHours = parsed[todayName]
      if (!todayHours || todayHours === 'Closed') {
        return { isOpen: false, text: `Closed today` }
      }
      if (todayHours === 'Open 24 hours' || todayHours === '24 Hours') {
        return { isOpen: true, text: 'Open 24 hours' }
      }
      // Try to parse HH:MM - HH:MM
      const timeRange = todayHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
      if (timeRange) {
        const openH = parseInt(timeRange[1], 10)
        const openM = parseInt(timeRange[2], 10)
        const closeH = parseInt(timeRange[3], 10)
        const closeM = parseInt(timeRange[4], 10)
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const openMinutes = openH * 60 + openM
        const closeMinutes = closeH * 60 + closeM
        const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes
        return { isOpen, text: todayHours }
      }
      return { isOpen: true, text: todayHours }
    }
    return { isOpen: true, text: String(parsed) }
  } catch {
    return { isOpen: true, text: hours }
  }
}

// ===== Loading State =====
function LoadingState({ theme }: { theme: ReturnType<typeof getThemeClasses> }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={`w-8 h-8 animate-spin ${theme.muted}`} />
        <p className={`text-sm ${theme.muted}`}>Loading menu...</p>
      </div>
    </div>
  )
}

// ===== Error State =====
function ErrorState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Menu Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">
          This menu is not available or the link may be incorrect.
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <span>Powered by</span>
          <span className="font-bold text-gray-600">MenuQR</span>
          <span>·</span>
          <span className="font-semibold text-gray-600">ALTECH</span>
        </div>
      </div>
    </div>
  )
}

// ===== Unavailable State =====
function UnavailableState({ theme }: { theme: ReturnType<typeof getThemeClasses> }) {
  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${theme.bg}`}>
      <div className="text-center max-w-sm">
        <div className={`w-16 h-16 rounded-full ${theme.card} flex items-center justify-center mx-auto mb-4`}>
          <Clock className={`w-8 h-8 ${theme.muted}`} />
        </div>
        <h1 className={`text-xl font-bold ${theme.fg} mb-2`}>Menu Unavailable</h1>
        <p className={`text-sm ${theme.muted} mb-6`}>
          This menu is currently unavailable. Please check back later or contact the business directly.
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <span>Powered by</span>
          <span className="font-bold text-gray-600">MenuQR</span>
          <span>·</span>
          <span className="font-semibold text-gray-600">ALTECH</span>
        </div>
      </div>
    </div>
  )
}

// ===== Uploaded Menu Display =====
function UploadedMenuDisplay({ upload, theme }: { upload: UploadData; theme: ReturnType<typeof getThemeClasses> }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  if (upload.fileType === 'pdf') {
    return (
      <div className={`min-h-screen ${theme.bg}`}>
        <iframe
          src={upload.fileUrl}
          title="Menu"
          className="w-full h-screen border-0"
          style={{ minHeight: 'calc(100vh - 120px)' }}
        />
      </div>
    )
  }

  // Image display with pinch-to-zoom
  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className="relative w-full overflow-hidden">
        {!imageLoaded && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className={`w-8 h-8 animate-spin ${theme.muted}`} />
          </div>
        )}
        <img
          src={upload.fileUrl}
          alt="Menu"
          className={`w-full h-auto transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
      </div>
    </div>
  )
}

// ===== Item Image Component =====
function ItemImage({
  imageUrl,
  itemName,
  theme,
  size = 'grid',
}: {
  imageUrl: string | null
  itemName: string
  theme: ReturnType<typeof getThemeClasses>
  size?: 'grid' | 'list' | 'compact'
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const sizeClasses = {
    grid: 'w-full aspect-square',
    list: 'w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0',
    compact: 'w-14 h-14 rounded-md flex-shrink-0',
  }

  if (!imageUrl || error) {
    return (
      <div className={`${sizeClasses[size]} ${theme.placeholder} flex items-center justify-center`}>
        <UtensilsCrossed className={`w-6 h-6 ${theme.placeholderIcon} ${size === 'compact' ? 'w-4 h-4' : ''}`} />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${sizeClasses[size]}`}>
      {!loaded && (
        <div className={`absolute inset-0 ${theme.placeholder} animate-pulse`} />
      )}
      <img
        src={imageUrl}
        alt={itemName}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  )
}

// ===== Menu Item Card (Grid) =====
function GridItemCard({
  item,
  design,
  theme,
  cartQuantity,
  onQuantityChange,
}: {
  item: MenuItemData
  design: DesignData
  theme: ReturnType<typeof getThemeClasses>
  cartQuantity: number
  onQuantityChange: (delta: number) => void
}) {
  const unavailable = !item.isAvailable

  return (
    <div
      className={`rounded-xl overflow-hidden border ${theme.cardBorder} transition-all duration-200 ${
        unavailable ? 'opacity-60' : ''
      } ${theme.card}`}
    >
      {/* Image */}
      <div className="relative">
        <ItemImage imageUrl={item.imageUrl} itemName={item.name} theme={theme} size="grid" />
        {unavailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="secondary" className="bg-red-500 text-white text-xs font-semibold px-2.5 py-0.5">
              Sold Out
            </Badge>
          </div>
        )}
        {/* WhatsApp order quantity indicator */}
        {cartQuantity > 0 && (
          <div
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
            style={{ backgroundColor: design.secondaryColor }}
          >
            {cartQuantity}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className={`text-sm font-semibold leading-tight line-clamp-1 ${theme.fg}`}>{item.name}</h3>
        {item.description && (
          <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${theme.muted}`}>{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold" style={{ color: design.secondaryColor }}>
            {formatPrice(item.price)}
          </span>
          {!unavailable && design.whatsappEnabled && cartQuantity === 0 && (
            <button
              onClick={() => onQuantityChange(1)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150"
              style={{ backgroundColor: `${design.secondaryColor}20`, color: design.secondaryColor }}
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {!unavailable && cartQuantity > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQuantityChange(-1)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 border"
                style={{
                  borderColor: design.secondaryColor,
                  color: design.secondaryColor,
                }}
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className={`text-sm font-bold w-5 text-center ${theme.fg}`}>{cartQuantity}</span>
              <button
                onClick={() => onQuantityChange(1)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors duration-150"
                style={{ backgroundColor: design.secondaryColor }}
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Menu Item Card (List) =====
function ListItemCard({
  item,
  design,
  theme,
  cartQuantity,
  onQuantityChange,
}: {
  item: MenuItemData
  design: DesignData
  theme: ReturnType<typeof getThemeClasses>
  cartQuantity: number
  onQuantityChange: (delta: number) => void
}) {
  const unavailable = !item.isAvailable

  return (
    <div
      className={`flex gap-3 sm:gap-4 p-3 rounded-xl border ${theme.cardBorder} transition-all duration-200 ${
        unavailable ? 'opacity-60' : ''
      } ${theme.card}`}
    >
      <ItemImage imageUrl={item.imageUrl} itemName={item.name} theme={theme} size="list" />
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold leading-tight ${theme.fg}`}>{item.name}</h3>
        {item.description && (
          <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${theme.muted}`}>{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: design.secondaryColor }}>
              {formatPrice(item.price)}
            </span>
            {unavailable && (
              <Badge variant="secondary" className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0">
                Sold Out
              </Badge>
            )}
          </div>
          {!unavailable && design.whatsappEnabled && (
            <>
              {cartQuantity === 0 ? (
                <button
                  onClick={() => onQuantityChange(1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
                  style={{ backgroundColor: `${design.secondaryColor}20`, color: design.secondaryColor }}
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onQuantityChange(-1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 border"
                    style={{ borderColor: design.secondaryColor, color: design.secondaryColor }}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={`text-sm font-bold w-5 text-center ${theme.fg}`}>{cartQuantity}</span>
                  <button
                    onClick={() => onQuantityChange(1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors duration-150"
                    style={{ backgroundColor: design.secondaryColor }}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Menu Item Card (Compact) =====
function CompactItemCard({
  item,
  design,
  theme,
  cartQuantity,
  onQuantityChange,
}: {
  item: MenuItemData
  design: DesignData
  theme: ReturnType<typeof getThemeClasses>
  cartQuantity: number
  onQuantityChange: (delta: number) => void
}) {
  const unavailable = !item.isAvailable

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${theme.cardBorder} transition-all duration-150 ${
        unavailable ? 'opacity-60' : ''
      } ${theme.card}`}
    >
      <ItemImage imageUrl={item.imageUrl} itemName={item.name} theme={theme} size="compact" />
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold leading-tight ${theme.fg}`}>{item.name}</h3>
        <p className={`text-xs mt-0.5 line-clamp-1 ${theme.muted}`}>
          {item.description || ''}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: design.secondaryColor }}>
          {formatPrice(item.price)}
        </span>
        {unavailable && (
          <span className="text-[10px] text-red-500 font-semibold">Sold Out</span>
        )}
        {!unavailable && design.whatsappEnabled && (
          <>
            {cartQuantity > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onQuantityChange(-1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center border transition-colors duration-150"
                  style={{ borderColor: design.secondaryColor, color: design.secondaryColor }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className={`text-xs font-bold w-4 text-center ${theme.fg}`}>{cartQuantity}</span>
                <button
                  onClick={() => onQuantityChange(1)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-colors duration-150"
                  style={{ backgroundColor: design.secondaryColor }}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
            {cartQuantity === 0 && (
              <button
                onClick={() => onQuantityChange(1)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150"
                style={{ backgroundColor: `${design.secondaryColor}20`, color: design.secondaryColor }}
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ===== Category Section =====
function CategorySection({
  category,
  design,
  theme,
  cart,
  onQuantityChange,
  sectionRef,
}: {
  category: CategoryData
  design: DesignData
  theme: ReturnType<typeof getThemeClasses>
  cart: CartItem[]
  onQuantityChange: (itemId: string, delta: number) => void
  sectionRef: (el: HTMLDivElement | null) => void
}) {
  const visibleItems = category.items.filter((i) => !i.isHidden)

  if (visibleItems.length === 0) return null

  const layout = design.menuLayout || 'grid'

  return (
    <section ref={sectionRef} className="scroll-mt-[180px]">
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-base sm:text-lg font-bold ${theme.fg}`}>{category.name}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${theme.tabBg} ${theme.tabText} border ${theme.cardBorder}`}>
          {visibleItems.length}
        </span>
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {visibleItems.map((item) => (
            <GridItemCard
              key={item.id}
              item={item}
              design={design}
              theme={theme}
              cartQuantity={cart.find((c) => c.itemId === item.id)?.quantity || 0}
              onQuantityChange={(delta) => onQuantityChange(item.id, delta)}
            />
          ))}
        </div>
      ) : layout === 'compact' ? (
        <div className="flex flex-col gap-2">
          {visibleItems.map((item) => (
            <CompactItemCard
              key={item.id}
              item={item}
              design={design}
              theme={theme}
              cartQuantity={cart.find((c) => c.itemId === item.id)?.quantity || 0}
              onQuantityChange={(delta) => onQuantityChange(item.id, delta)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleItems.map((item) => (
            <ListItemCard
              key={item.id}
              item={item}
              design={design}
              theme={theme}
              cartQuantity={cart.find((c) => c.itemId === item.id)?.quantity || 0}
              onQuantityChange={(delta) => onQuantityChange(item.id, delta)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ===== Floating WhatsApp Cart Bar =====
function WhatsAppCartBar({
  cart,
  businessName,
  whatsappNumber,
  design,
  theme,
  visible,
}: {
  cart: CartItem[]
  businessName: string
  whatsappNumber: string
  design: DesignData
  theme: ReturnType<typeof getThemeClasses>
  visible: boolean
}) {
  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)

  const handleSendOrder = () => {
    const lines = cart.map(
      (item) => `${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    )
    const message = `🛒 New Order from ${businessName}\n\n${lines.join('\n')}\n\n💰 Total: ${formatPrice(total)}`
    const encoded = encodeURIComponent(message)
    // Clean whatsapp number - remove spaces, dashes, etc.
    const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '')
    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank')
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className={`${theme.overlay} absolute inset-0 pointer-events-none`}
        style={{ top: '-8px' }}
      />
      <div className={`${theme.card} border-t ${theme.cardBorder} px-4 py-3 safe-area-bottom`}>
        <button
          onClick={handleSendOrder}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-colors duration-150 shadow-lg active:scale-[0.98]"
          style={{ backgroundColor: '#25D366' }}
          aria-label="Send order via WhatsApp"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Send Order</span>
          <span className="text-white/80">·</span>
          <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          <span className="text-white/80">·</span>
          <span className="font-bold">{formatPrice(total)}</span>
        </button>
      </div>
    </div>
  )
}

// ===== Floating WhatsApp Button (when cart is empty) =====
function FloatingWhatsAppButton({
  whatsappNumber,
  theme,
  visible,
}: {
  whatsappNumber: string
  theme: ReturnType<typeof getThemeClasses>
  visible: boolean
}) {
  const handleClick = () => {
    const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '')
    window.open(`https://wa.me/${cleanNumber}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95 ${
        visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      }`}
      style={{ backgroundColor: '#25D366' }}
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  )
}

// ===== Main PublicMenuPage Component =====
export function PublicMenuPage() {
  const pageParams = useAppStore((s) => s.pageParams)
  const slug = pageParams.slug as string

  // Data state
  const [data, setData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartVisible, setCartVisible] = useState(true)

  // Refs
  const categoryRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const categoryTabBarRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Theme
  const theme = useMemo(() => getThemeClasses(data?.design.backgroundStyle || 'light'), [data])
  const fontFamily = useMemo(() => fontClasses[data?.design.fontStyle || 'modern'] || 'font-sans', [data])

  // ===== Fetch data on mount =====
  useEffect(() => {
    if (!slug) {
      setError(true)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(false)
        setUnavailable(false)

        const result = await publicMenuApi.getBySlug(slug)

        if (cancelled) return

        if (result.error) {
          setError(true)
          return
        }

        // Check if business is unpublished
        if (result.business.status === 'unpublished') {
          setUnavailable(true)
          return
        }

        setData(result)

        // Track the view
        analyticsApi.track({
          businessId: result.business.id,
          eventType: 'view',
        })
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [slug])

  // ===== Set initial active category when data loads =====
  useEffect(() => {
    if (data?.categories && data.categories.length > 0) {
      setActiveCategoryId(data.categories[0].id)
    }
  }, [data])

  // ===== IntersectionObserver for auto-detecting active category on scroll =====
  useEffect(() => {
    if (!data?.categories || data.categories.length === 0) return

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry that is most visible
        const visibleEntries = entries.filter((e) => e.isIntersecting)
        if (visibleEntries.length > 0) {
          // Use the entry with the highest intersection ratio
          const mostVisible = visibleEntries.reduce((prev, curr) =>
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          )
          if (mostVisible.target.id) {
            setActiveCategoryId(mostVisible.target.id)
          }
        }
      },
      {
        rootMargin: '-140px 0px -50% 0px', // Account for sticky header + search + tabs
        threshold: [0, 0.25, 0.5],
      }
    )

    observerRef.current = observer

    // Observe all category sections
    categoryRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
    }
  }, [data])

  // ===== Category section ref callback =====
  const setCategoryRef = useCallback(
    (categoryId: string) => (el: HTMLDivElement | null) => {
      if (el) {
        el.id = `category-${categoryId}`
        categoryRefs.current.set(categoryId, el)
      } else {
        categoryRefs.current.delete(categoryId)
      }
    },
    []
  )

  // ===== Scroll to category =====
  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId)
    const el = categoryRefs.current.get(categoryId)
    if (el) {
      const offset = 160 // Sticky header + search + tabs height
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  // ===== Search filtering =====
  const filteredCategories = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data.categories

    const query = searchQuery.toLowerCase().trim()

    return data.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [data, searchQuery])

  // ===== Cart operations =====
  const handleQuantityChange = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      // Find item details from data
      const item = data?.categories
        .flatMap((c) => c.items)
        .find((i) => i.id === itemId)
      if (!item) return prev

      const existing = prev.find((c) => c.itemId === itemId)
      if (existing) {
        const newQty = existing.quantity + delta
        if (newQty <= 0) return prev.filter((c) => c.itemId !== itemId)
        return prev.map((c) => (c.itemId === itemId ? { ...c, quantity: newQty } : c))
      }

      if (delta > 0) {
        return [...prev, { itemId, name: item.name, price: item.price, quantity: 1 }]
      }
      return prev
    })
  }, [data])

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  // ===== Determine display mode =====
  const isUploadedMenuMode = useMemo(() => {
    if (!data) return false
    if (data.upload && data.upload.status === 'published' && !hasVisibleItems(data.categories)) {
      return true
    }
    return false
  }, [data])

  const whatsappEnabled = data?.design.whatsappEnabled && !!data?.design.whatsappNumber

  // ===== Render =====
  // Loading
  if (loading) return <LoadingState theme={theme} />

  // Error
  if (error) return <ErrorState />

  // Unavailable
  if (unavailable) return <UnavailableState theme={theme} />

  // No data
  if (!data) return <ErrorState />

  // Uploaded menu mode
  if (isUploadedMenuMode && data.upload) {
    return <UploadedMenuDisplay upload={data.upload} theme={theme} />
  }

  // ===== Digital Menu Mode =====
  const { business, design, categories } = data
  const hours = parseOpeningHours(business.openingHours)
  const visibleCategories = categories.filter((c) => !c.isHidden)

  return (
    <div className={`min-h-screen ${theme.bg} ${fontFamily} ${theme.fg}`} style={{ scrollBehavior: 'smooth' }}>
      {/* ===== Header Section ===== */}
      <header
        className="sticky top-0 z-30 transition-colors duration-200"
        style={{ backgroundColor: design.primaryColor }}
      >
        <div className="px-4 pt-4 pb-3 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Logo + Name Row */}
            <div className="flex items-center gap-3">
              {business.logoUrl && (
                <img
                  src={business.logoUrl}
                  alt={`${business.name} logo`}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 flex-shrink-0"
                  style={{ borderColor: design.secondaryColor }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{business.name}</h1>
                {business.description && (
                  <p className="text-xs sm:text-sm text-white/70 mt-0.5 line-clamp-2">{business.description}</p>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className={`w-2 h-2 rounded-full ${hours.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`text-xs font-medium ${hours.isOpen ? 'text-green-300' : 'text-red-300'}`}>
                {hours.isOpen ? 'Open Now' : 'Closed'}
              </span>
              <span className="text-white/40">·</span>
              <Clock className="w-3 h-3 text-white/40" />
              <span className="text-xs text-white/60">{hours.text}</span>
            </div>

            {/* Contact Row */}
            <div className="flex items-center gap-2 mt-3">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 active:scale-95"
                  style={{ backgroundColor: `${design.secondaryColor}30`, color: design.secondaryColor }}
                  aria-label={`Call ${business.phone}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/[^0-9+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-green-50 transition-colors duration-150 active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                  aria-label="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
              {business.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/70 bg-white/10 transition-colors duration-150 active:scale-95"
                  aria-label={`Open map: ${business.address}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline truncate max-w-[120px]">{business.address}</span>
                  <span className="sm:hidden">Map</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ===== Search Bar (sticky within header) ===== */}
        <div className={`px-4 sm:px-6 py-2.5 ${theme.headerBg} border-t ${theme.cardBorder}`}>
          <div className="max-w-3xl mx-auto relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.muted}`} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border ${theme.searchBorder} ${theme.searchBg} ${theme.searchInput} outline-none transition-colors duration-150 focus:ring-2`}
              style={{ '--tw-ring-color': design.secondaryColor } as React.CSSProperties}
              aria-label="Search menu items"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-150 ${theme.muted}`}
                style={{ backgroundColor: `${design.secondaryColor}15` }}
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ===== Category Navigation (sticky within header) ===== */}
        {!searchQuery.trim() && visibleCategories.length > 1 && (
          <div
            ref={categoryTabBarRef}
            className={`px-4 sm:px-6 py-2 ${theme.headerBg} border-t ${theme.cardBorder}`}
          >
            <div className="max-w-3xl mx-auto">
              <nav
                className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                role="tablist"
                aria-label="Menu categories"
              >
                {visibleCategories.map((cat) => {
                  const isActive = activeCategoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                        isActive
                          ? 'text-white shadow-md'
                          : `${theme.tabText} border ${theme.cardBorder}`
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: design.secondaryColor }
                          : { backgroundColor: 'transparent' }
                      }
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* ===== Main Menu Content ===== */}
      <main className="px-4 sm:px-6 py-4 pb-24 sm:pb-28">
        <div className="max-w-3xl mx-auto">
          {visibleCategories.length === 0 || filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`w-14 h-14 rounded-full ${theme.card} flex items-center justify-center mb-3`}>
                <UtensilsCrossed className={`w-7 h-7 ${theme.muted}`} />
              </div>
              <p className={`text-sm font-medium ${theme.fg}`}>
                {searchQuery ? 'No items match your search' : 'No menu items available yet'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-medium mt-2 underline underline-offset-2"
                  style={{ color: design.secondaryColor }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* Search results header */}
              {searchQuery.trim() && (
                <p className={`text-sm ${theme.muted}`}>
                  {filteredCategories.reduce((sum, c) => sum + c.items.length, 0)} result{filteredCategories.reduce((sum, c) => sum + c.items.length, 0) !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
              )}

              {filteredCategories.map((cat) => (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  design={design}
                  theme={theme}
                  cart={cart}
                  onQuantityChange={handleQuantityChange}
                  sectionRef={setCategoryRef(cat.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== Footer ===== */}
      <footer className={`px-4 sm:px-6 py-6 border-t ${theme.footer}`}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs">
            Powered by <span className="font-bold text-gray-600">MenuQR</span> ·{' '}
            <span className="font-semibold text-gray-600">ALTECH</span>
          </p>
          {(business.phone || business.address) && (
            <div className={`flex items-center justify-center gap-3 mt-2 text-xs ${theme.muted}`}>
              {business.phone && (
                <a href={`tel:${business.phone}`} className="underline underline-offset-2 hover:no-underline">
                  {business.phone}
                </a>
              )}
              {business.phone && business.address && <span>·</span>}
              {business.address && <span>{business.address}</span>}
            </div>
          )}
        </div>
      </footer>

      {/* ===== WhatsApp Floating Elements ===== */}
      {whatsappEnabled && (
        <>
          {cartItemCount > 0 ? (
            <WhatsAppCartBar
              cart={cart}
              businessName={business.name}
              whatsappNumber={design.whatsappNumber!}
              design={design}
              theme={theme}
              visible={cartVisible}
            />
          ) : (
            <FloatingWhatsAppButton
              whatsappNumber={design.whatsappNumber!}
              theme={theme}
              visible={cartVisible}
            />
          )}
        </>
      )}
    </div>
  )
}
