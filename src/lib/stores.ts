import { create } from 'zustand'

// ===== App Routing Store =====
export type AppPage =
  | 'landing'
  | 'login'
  | 'register'
  | 'create-business'
  | 'dashboard'
  | 'menu-manager'
  | 'upload-menu'
  | 'ai-scanner'
  | 'design-templates'
  | 'qr-code'
  | 'preview'
  | 'analytics'
  | 'business-settings'
  | 'account-settings'
  | 'admin'
  | 'public-menu'

interface AppState {
  currentPage: AppPage
  pageParams: Record<string, string>
  sidebarOpen: boolean
  setCurrentPage: (page: AppPage, params?: Record<string, string>) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'landing',
  pageParams: {},
  sidebarOpen: false,
  setCurrentPage: (page, params = {}) => set({ currentPage: page, pageParams: params, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

// ===== Auth Store =====
export interface UserInfo {
  id: string
  email: string
  name: string | null
  role: string
}

export interface BusinessInfo {
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
  memberRole: string
}

interface AuthState {
  user: UserInfo | null
  businesses: BusinessInfo[]
  currentBusiness: BusinessInfo | null
  loading: boolean
  setUser: (user: UserInfo | null) => void
  setBusinesses: (businesses: BusinessInfo[]) => void
  setCurrentBusiness: (business: BusinessInfo | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  businesses: [],
  currentBusiness: null,
  loading: true,
  setUser: (user) => set({ user }),
  setBusinesses: (businesses) => set({ businesses }),
  setCurrentBusiness: (business) => set({ currentBusiness: business }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, businesses: [], currentBusiness: null }),
}))

// ===== Menu Editor Store =====
export interface Category {
  id: string
  name: string
  sortOrder: number
  isHidden: boolean
  items: MenuItem[]
 _isNew?: boolean
  _deleted?: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  categoryId: string
  sortOrder: number
  isAvailable: boolean
  isHidden: boolean
  _isNew?: boolean
  _deleted?: boolean
}

interface MenuState {
  categories: Category[]
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, data: Partial<Category>) => void
  removeCategory: (id: string) => void
  reorderCategories: (reordered: Category[]) => void
  addItem: (categoryId: string, item: MenuItem) => void
  updateItem: (categoryId: string, itemId: string, data: Partial<MenuItem>) => void
  removeItem: (categoryId: string, itemId: string) => void
  reorderItems: (categoryId: string, reordered: MenuItem[]) => void
  duplicateItem: (categoryId: string, itemId: string) => void
  resetMenu: () => void
}

export const useMenuStore = create<MenuState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((s) => ({ categories: [...s.categories, category] })),
  updateCategory: (id, data) => set((s) => ({
    categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),
  removeCategory: (id) => set((s) => ({
    categories: s.categories.filter((c) => c.id !== id),
  })),
  reorderCategories: (reordered) => set({ categories: reordered }),
  addItem: (categoryId, item) => set((s) => ({
    categories: s.categories.map((c) =>
      c.id === categoryId ? { ...c, items: [...c.items, item] } : c
    ),
  })),
  updateItem: (categoryId, itemId, data) => set((s) => ({
    categories: s.categories.map((c) =>
      c.id === categoryId
        ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...data } : i)) }
        : c
    ),
  })),
  removeItem: (categoryId, itemId) => set((s) => ({
    categories: s.categories.map((c) =>
      c.id === categoryId
        ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
        : c
    ),
  })),
  reorderItems: (categoryId, reordered) => set((s) => ({
    categories: s.categories.map((c) =>
      c.id === categoryId ? { ...c, items: reordered } : c
    ),
  })),
  duplicateItem: (categoryId, itemId) => set((s) => ({
    categories: s.categories.map((c) => {
      if (c.id !== categoryId) return c
      const item = c.items.find((i) => i.id === itemId)
      if (!item) return c
      const dup = { ...item, id: crypto.randomUUID(), name: `${item.name} (Copy)`, _isNew: true }
      const idx = c.items.findIndex((i) => i.id === itemId)
      const items = [...c.items]
      items.splice(idx + 1, 0, dup)
      return { ...c, items }
    }),
  })),
  resetMenu: () => set({ categories: [] }),
}))

// ===== AI Scanner Store =====
interface AiScanState {
  isScanning: boolean
  detectedItems: DetectedItem[]
  setScanning: (v: boolean) => void
  setDetectedItems: (items: DetectedItem[]) => void
  updateDetectedItem: (idx: number, data: Partial<DetectedItem>) => void
  removeDetectedItem: (idx: number) => void
  addDetectedItem: (item: DetectedItem) => void
  resetScan: () => void
}

export interface DetectedItem {
  name: string
  description: string
  price: number
  category: string
}

export const useAiScanStore = create<AiScanState>((set) => ({
  isScanning: false,
  detectedItems: [],
  setScanning: (v) => set({ isScanning: v }),
  setDetectedItems: (items) => set({ detectedItems: items }),
  updateDetectedItem: (idx, data) => set((s) => ({
    detectedItems: s.detectedItems.map((item, i) => (i === idx ? { ...item, ...data } : item)),
  })),
  removeDetectedItem: (idx) => set((s) => ({
    detectedItems: s.detectedItems.filter((_, i) => i !== idx),
  })),
  addDetectedItem: (item) => set((s) => ({
    detectedItems: [...s.detectedItems, item],
  })),
  resetScan: () => set({ isScanning: false, detectedItems: [] }),
}))

// ===== Design Store =====
interface DesignState {
  templateId: string | null
  primaryColor: string
  secondaryColor: string
  fontStyle: string
  backgroundStyle: string
  logoPosition: string
  menuLayout: string
  whatsappEnabled: boolean
  whatsappNumber: string
  seoEnabled: boolean
  setDesign: (data: Partial<DesignState>) => void
  resetDesign: () => void
}

export const useDesignStore = create<DesignState>((set) => ({
  templateId: null,
  primaryColor: '#1a1a2e',
  secondaryColor: '#e94560',
  fontStyle: 'modern',
  backgroundStyle: 'light',
  logoPosition: 'top-center',
  menuLayout: 'grid',
  whatsappEnabled: false,
  whatsappNumber: '',
  seoEnabled: true,
  setDesign: (data) => set(data),
  resetDesign: () => set({
    templateId: null, primaryColor: '#1a1a2e', secondaryColor: '#e94560',
    fontStyle: 'modern', backgroundStyle: 'light', logoPosition: 'top-center',
    menuLayout: 'grid', whatsappEnabled: false, whatsappNumber: '', seoEnabled: true,
  }),
}))
