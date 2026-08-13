'use client'

import { useState } from 'react'
import { useAppStore, useAuthStore, type AppPage } from '@/lib/stores'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  LayoutDashboard,
  BookOpen,
  Upload,
  ScanLine,
  Palette,
  QrCode,
  Eye,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Building2,
} from 'lucide-react'

// ===== Navigation Items =====
interface NavItem {
  page: AppPage
  label: string
  icon: React.ElementType
}

const mainNavItems: NavItem[] = [
  { page: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { page: 'menu-manager', label: 'Menu Manager', icon: BookOpen },
  { page: 'upload-menu', label: 'Upload Menu', icon: Upload },
  { page: 'ai-scanner', label: 'AI Menu Scanner', icon: ScanLine },
  { page: 'design-templates', label: 'Design Templates', icon: Palette },
  { page: 'qr-code', label: 'QR Code', icon: QrCode },
  { page: 'preview', label: 'Customer Preview', icon: Eye },
  { page: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const bottomNavItems: NavItem[] = [
  { page: 'business-settings', label: 'Business Settings', icon: Settings },
  { page: 'account-settings', label: 'Account Settings', icon: User },
]

// ===== Page Title Map =====
const pageTitleMap: Record<AppPage, string> = {
  landing: 'Welcome',
  login: 'Sign In',
  register: 'Create Account',
  'create-business': 'Create Business',
  dashboard: 'Overview',
  'menu-manager': 'Menu Manager',
  'upload-menu': 'Upload Menu',
  'ai-scanner': 'AI Menu Scanner',
  'design-templates': 'Design Templates',
  'qr-code': 'QR Code',
  preview: 'Customer Preview',
  analytics: 'Analytics',
  'business-settings': 'Business Settings',
  'account-settings': 'Account Settings',
  admin: 'Admin Panel',
  'public-menu': 'Public Menu',
}

// ===== Sidebar Nav Component =====
interface SidebarNavProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
  onSignOut: () => void
  onSheetClose?: () => void
}

function SidebarNav({ currentPage, onNavigate, onSignOut, onSheetClose }: SidebarNavProps) {
  return (
    <ScrollArea className="flex-1 px-3 py-4">
      <div className="flex flex-col gap-1">
        {/* Main Navigation */}
        <div className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const isActive = currentPage === item.page
            const Icon = item.icon
            return (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page)
                  onSheetClose?.()
                }}
                className={`
                  group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 w-full text-left
                  ${
                    isActive
                      ? 'bg-[#e94560] text-white shadow-md shadow-[#e94560]/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Separator */}
        <Separator className="my-3 bg-white/10" />

        {/* Bottom Navigation */}
        <div className="flex flex-col gap-1">
          {bottomNavItems.map((item) => {
            const isActive = currentPage === item.page
            const Icon = item.icon
            return (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page)
                  onSheetClose?.()
                }}
                className={`
                  group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 w-full text-left
                  ${
                    isActive
                      ? 'bg-[#e94560] text-white shadow-md shadow-[#e94560]/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Separator */}
        <Separator className="my-3 bg-white/10" />

        {/* Sign Out */}
        <button
          onClick={() => {
            onSignOut()
            onSheetClose?.()
          }}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
            text-red-400/80 hover:text-red-400 hover:bg-red-500/10
            transition-all duration-200 w-full text-left"
        >
          <LogOut className="h-5 w-5 shrink-0 text-red-400/50 group-hover:text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </ScrollArea>
  )
}

// ===== Main DashboardLayout Component =====
interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentPage, setCurrentPage } = useAppStore()
  const { user, businesses, currentBusiness, setCurrentBusiness, logout } = useAuthStore()
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page)
  }

  const handleBusinessSwitch = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    if (business) {
      setCurrentBusiness(business)
      toast.success(`Switched to ${business.name}`)
      // Navigate to dashboard on switch to refresh data
      setCurrentPage('dashboard')
    }
  }

  const handleSignOut = async () => {
    try {
      await authApi.logout()
      logout()
      setCurrentPage('landing')
      toast.success('Signed out successfully')
    } catch {
      // Sign out locally even if API fails
      logout()
      setCurrentPage('landing')
      toast.success('Signed out successfully')
    }
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email[0].toUpperCase()
      : 'U'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left: Logo + Business Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#1a1a2e] shrink-0">
              <Menu className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-gray-900 tracking-tight">
                Menu<span className="text-[#e94560]">QR</span>
              </span>
              {currentBusiness && (
                <p className="text-xs text-gray-400 truncate max-w-[140px]">
                  {currentBusiness.name}
                </p>
              )}
            </div>
          </div>

          {/* Right: Hamburger Menu */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-[#1a1a2e] border-white/10">
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#e94560]">
                    <Menu className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-base font-bold tracking-tight">
                    Menu<span className="text-[#e94560]">QR</span>
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* Business Switcher in Mobile Sheet */}
              {businesses.length > 1 && (
                <div className="px-3 pb-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center justify-between w-full rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-white/80 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-4 w-4 text-white/50 shrink-0" />
                          <span className="truncate">{currentBusiness?.name || 'Select Business'}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-white/50 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start" className="w-56">
                      <DropdownMenuLabel>Switch Business</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {businesses.map((biz) => (
                        <DropdownMenuItem
                          key={biz.id}
                          onClick={() => handleBusinessSwitch(biz.id)}
                          className={currentBusiness?.id === biz.id ? 'bg-accent' : ''}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          <span className="truncate">{biz.name}</span>
                          {currentBusiness?.id === biz.id && (
                            <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                              Active
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <Separator className="bg-white/10 mx-3" />

              {/* Navigation */}
              <SidebarNav
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onSignOut={handleSignOut}
                onSheetClose={() => setMobileSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 flex-col bg-[#1a1a2e] z-30">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#e94560] shadow-lg shadow-[#e94560]/20">
            <Menu className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">
              Menu<span className="text-[#e94560]">QR</span>
            </span>
            <p className="text-[10px] text-white/30 font-medium tracking-wider uppercase">
              by ALTECH
            </p>
          </div>
        </div>

        {/* Business Switcher */}
        {businesses.length > 1 && (
          <div className="px-3 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between w-full rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-sm text-white/80 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-white/50 shrink-0" />
                    <span className="truncate">{currentBusiness?.name || 'Select Business'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/50 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-56">
                <DropdownMenuLabel>Switch Business</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {businesses.map((biz) => (
                  <DropdownMenuItem
                    key={biz.id}
                    onClick={() => handleBusinessSwitch(biz.id)}
                    className={currentBusiness?.id === biz.id ? 'bg-accent' : ''}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="truncate">{biz.name}</span>
                    {currentBusiness?.id === biz.id && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Single Business Badge */}
        {businesses.length <= 1 && currentBusiness && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <Building2 className="h-4 w-4 text-white/40 shrink-0" />
              <span className="text-xs text-white/50 truncate">{currentBusiness.name}</span>
            </div>
          </div>
        )}

        <Separator className="bg-white/10 mx-3" />

        {/* Navigation */}
        <SidebarNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 md:h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="flex h-full items-center justify-between px-4 md:px-6">
            {/* Left: Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Spacer on mobile for fixed top bar alignment */}
              <div className="md:hidden w-8" />
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {pageTitleMap[currentPage] || 'Dashboard'}
              </h1>
              {currentBusiness && (
                <Badge variant="secondary" className="hidden sm:inline-flex shrink-0">
                  {currentBusiness.name}
                </Badge>
              )}
            </div>

            {/* Right: User Avatar & Dropdown */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-gray-200 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={undefined} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-[#1a1a2e] text-white text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline-block text-sm font-medium text-gray-700 max-w-[140px] truncate">
                      {user?.name || user?.email || 'User'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentPage('account-settings')}>
                    <User className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  {currentBusiness && (
                    <DropdownMenuItem onClick={() => setCurrentPage('business-settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Business Settings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
