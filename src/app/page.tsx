'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { useAppStore, useAuthStore } from '@/lib/stores'
import { authApi, businessApi } from '@/lib/api'

// Light imports for public pages
import { LandingPage } from '@/components/auth/LandingPage'
import { LoginPage } from '@/components/auth/LoginPage'
import { RegisterPage } from '@/components/auth/RegisterPage'
import { CreateBusinessPage } from '@/components/auth/CreateBusinessPage'
import { PublicMenuPage } from '@/components/public/PublicMenuPage'

// Dynamic imports for heavy dashboard pages
const DashboardLayout = dynamic(() => import('@/components/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })), { ssr: false })
const OverviewPage = dynamic(() => import('@/components/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage })), { ssr: false })
const MenuManagerPage = dynamic(() => import('@/components/dashboard/MenuManagerPage').then(m => ({ default: m.MenuManagerPage })), { ssr: false })
const UploadMenuPage = dynamic(() => import('@/components/dashboard/UploadMenuPage').then(m => ({ default: m.UploadMenuPage })), { ssr: false })
const AiScannerPage = dynamic(() => import('@/components/dashboard/AiScannerPage').then(m => ({ default: m.AiScannerPage })), { ssr: false })
const DesignTemplatesPage = dynamic(() => import('@/components/dashboard/DesignTemplatesPage').then(m => ({ default: m.DesignTemplatesPage })), { ssr: false })
const QrCodePage = dynamic(() => import('@/components/dashboard/QrCodePage').then(m => ({ default: m.QrCodePage })), { ssr: false })
const PreviewPage = dynamic(() => import('@/components/dashboard/PreviewPage').then(m => ({ default: m.PreviewPage })), { ssr: false })
const AnalyticsPage = dynamic(() => import('@/components/dashboard/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })), { ssr: false })
const BusinessSettingsPage = dynamic(() => import('@/components/dashboard/BusinessSettingsPage').then(m => ({ default: m.BusinessSettingsPage })), { ssr: false })
const AccountSettingsPage = dynamic(() => import('@/components/dashboard/AccountSettingsPage').then(m => ({ default: m.AccountSettingsPage })), { ssr: false })
const AdminPage = dynamic(() => import('@/components/dashboard/AdminPage').then(m => ({ default: m.AdminPage })), { ssr: false })

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#1a1a2e] border-t-[#e94560] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading MenuQR...</p>
      </div>
    </div>
  )
}

function UnauthorizedPage() {
  const { setCurrentPage } = useAppStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">Please sign in to access this page.</p>
        <button onClick={() => setCurrentPage('login')} className="px-6 py-2 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#1a1a2e]/90">Sign In</button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const { currentPage, setCurrentPage } = useAppStore()
  const { user, businesses, currentBusiness, setUser, setBusinesses, setCurrentBusiness, setLoading } = useAuthStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const u = session.user as any
      setUser({ id: u.userId || '', email: u.email || '', name: u.name || null, role: u.role || 'user' })
      businessApi.list().then((data: any) => {
        const bizList = data?.businesses || []
        setBusinesses(bizList)
        if (bizList.length > 0 && !currentBusiness) setCurrentBusiness(bizList[0])
        setLoading(false)
      }).catch(() => setLoading(false))
    } else if (status === 'unauthenticated') {
      setUser(null)
      setBusinesses([])
      setCurrentBusiness(null)
      setLoading(false)
    }
  }, [status, session])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash.startsWith('#/menu/')) {
      const slug = hash.replace('#/menu/', '')
      setCurrentPage('public-menu', { slug })
      return
    }
  }, [status, businesses.length])

  if (currentPage === 'public-menu') return <PublicMenuPage />
  if (status === 'loading') return <LoadingScreen />
  if (currentPage === 'landing') return <LandingPage />
  if (currentPage === 'login') return <LoginPage />
  if (currentPage === 'register') return <RegisterPage />
  if (status !== 'authenticated' || !user) return <UnauthorizedPage />
  if (currentPage === 'create-business') return <CreateBusinessPage />

  // Dashboard pages - loaded dynamically to reduce initial bundle
  const dashboardPages: Record<string, React.LazyExoticComponent<any, any>> = {
    'dashboard': OverviewPage,
    'menu-manager': MenuManagerPage,
    'upload-menu': UploadMenuPage,
    'ai-scanner': AiScannerPage,
    'design-templates': DesignTemplatesPage,
    'qr-code': QrCodePage,
    'preview': PreviewPage,
    'analytics': AnalyticsPage,
    'business-settings': BusinessSettingsPage,
  }

  const isDashboard = Object.keys(dashboardPages).includes(currentPage) || currentPage === 'account-settings' || currentPage === 'admin'

  if (isDashboard) {
    if (currentPage === 'admin') {
      if (user.role !== 'admin') return <UnauthorizedPage />
      return <DashboardLayout><AdminPage /></DashboardLayout>
    }
    if (currentPage === 'account-settings') return <DashboardLayout><AccountSettingsPage /></DashboardLayout>
    if (!currentBusiness) return <CreateBusinessPage />

    const PageComponent = dashboardPages[currentPage] || OverviewPage
    return <DashboardLayout><PageComponent /></DashboardLayout>
  }

  if (status === 'authenticated' && businesses.length > 0) {
    return <DashboardLayout><OverviewPage /></DashboardLayout>
  }

  return <LandingPage />
}
