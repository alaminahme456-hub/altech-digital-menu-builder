'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, useAuthStore, type AppPage } from '@/lib/stores'
import { analyticsApi, categoryApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  UtensilsCrossed,
  Eye,
  QrCode,
  CircleCheck,
  AlertCircle,
  BookOpen,
  Upload,
  ScanLine,
  Palette,
  ArrowRight,
  BarChart3,
  Clock,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react'

// ===== Types =====
interface AnalyticsData {
  totalViews: number
  todayViews: number
  weekViews: number
  monthViews: number
  qrScans: number
  mostViewedItems: { name: string; views: number }[]
  dailyData: { date: string; views: number; scans: number }[]
}

interface CategoryData {
  id: string
  name: string
  items: { id: string }[]
}

// ===== Quick Actions =====
interface QuickAction {
  page: AppPage
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
}

const quickActions: QuickAction[] = [
  {
    page: 'menu-manager',
    title: 'Create Menu Manually',
    description: 'Add and organize menu items by category',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    page: 'upload-menu',
    title: 'Upload Existing Menu',
    description: 'Upload a PDF or image of your current menu',
    icon: Upload,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    page: 'ai-scanner',
    title: 'Scan with AI',
    description: 'Let AI extract items from a menu photo',
    icon: ScanLine,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    page: 'design-templates',
    title: 'Choose Design',
    description: 'Customize the look of your digital menu',
    icon: Palette,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    page: 'qr-code',
    title: 'Get QR Code',
    description: 'Generate and download your QR code',
    icon: QrCode,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    page: 'analytics',
    title: 'View Analytics',
    description: 'Track views, scans, and popular items',
    icon: BarChart3,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
]

// ===== Recent Activity Item =====
interface ActivityItem {
  id: string
  action: string
  description: string
  time: string
  icon: React.ElementType
}

// ===== Stat Card Component =====
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  bgColor: string
  iconColor: string
  loading: boolean
}

function StatCard({ icon: Icon, label, value, subtext, bgColor, iconColor, loading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
            )}
            {subtext && !loading && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={`flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-xl ${bgColor} shrink-0`}>
            <Icon className={`h-5 w-5 md:h-6 md:w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Quick Action Card Component =====
interface QuickActionCardProps {
  action: QuickAction
  onNavigate: (page: AppPage) => void
}

function QuickActionCard({ action, onNavigate }: QuickActionCardProps) {
  const Icon = action.icon
  return (
    <button
      onClick={() => onNavigate(action.page)}
      className="group w-full text-left"
    >
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${action.bgColor} shrink-0`}>
              <Icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{action.title}</h3>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#e94560] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{action.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

// ===== Main OverviewPage Component =====
export function OverviewPage() {
  const { setCurrentPage } = useAppStore()
  const { user, currentBusiness } = useAuthStore()

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<ActivityItem[]>([])

  const businessId = currentBusiness?.id
  const businessName = currentBusiness?.name || 'your business'
  const menuStatus = currentBusiness?.status || 'draft'

  // Total menu items count from categories
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [analyticsData, categoriesData] = await Promise.allSettled([
        analyticsApi.get(businessId),
        categoryApi.list(businessId),
      ])

      if (analyticsData.status === 'fulfilled') {
        setAnalytics(analyticsData.value)
      }

      if (categoriesData.status === 'fulfilled') {
        setCategories(categoriesData.value)
      }

      // Generate sample recent activity based on fetched data
      const activities: ActivityItem[] = []

      if (categoriesData.status === 'fulfilled' && categoriesData.value.length > 0) {
        const latestCat = categoriesData.value[categoriesData.value.length - 1]
        activities.push({
          id: '1',
          action: 'Category Created',
          description: `"${latestCat.name}" category was added`,
          time: '2 hours ago',
          icon: FileText,
        })
      }

      if (analyticsData.status === 'fulfilled' && analyticsData.value.qrScans > 0) {
        activities.push({
          id: '2',
          action: 'QR Code Scanned',
          description: `${analyticsData.value.qrScans} scans this week`,
          time: '3 hours ago',
          icon: QrCode,
        })
      }

      if (analyticsData.status === 'fulfilled' && analyticsData.value.totalViews > 0) {
        activities.push({
          id: '3',
          action: 'Menu Views',
          description: `${analyticsData.value.totalViews} total views recorded`,
          time: '5 hours ago',
          icon: Eye,
        })
      }

      if (categoriesData.status === 'fulfilled' && totalItems > 0) {
        activities.push({
          id: '4',
          action: 'Menu Items Updated',
          description: `${totalItems} items across ${categories.length} categories`,
          time: 'Yesterday',
          icon: Sparkles,
        })
      }

      setActivity(activities)
    } catch {
      // Silently handle fetch errors - cards will show default values
    } finally {
      setLoading(false)
    }
  }, [businessId, categories.length, totalItems])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Determine menu status display
  const getStatusDisplay = () => {
    switch (menuStatus) {
      case 'published':
        return {
          icon: CircleCheck,
          label: 'Published',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
        }
      case 'draft':
        return {
          icon: FileText,
          label: 'Draft',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
        }
      case 'unpublished':
      default:
        return {
          icon: AlertCircle,
          label: 'Unpublished',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
        }
    }
  }

  const statusInfo = getStatusDisplay()
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ===== Welcome Section ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your menu for <span className="font-medium text-gray-700">{businessName}</span>
          </p>
        </div>
        {currentBusiness && (
          <Badge
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border-0 ${statusInfo.bgColor} ${statusInfo.color} self-start sm:self-auto`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </Badge>
        )}
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={UtensilsCrossed}
          label="Total Menu Items"
          value={loading ? 0 : totalItems}
          subtext={`${loading ? '-' : categories.length} categories`}
          bgColor="bg-[#e94560]/10"
          iconColor="text-[#e94560]"
          loading={loading}
        />
        <StatCard
          icon={Eye}
          label="Total Menu Views"
          value={loading ? 0 : analytics?.totalViews ?? 0}
          subtext={loading ? '' : `${analytics?.todayViews ?? 0} today`}
          bgColor="bg-sky-100"
          iconColor="text-sky-600"
          loading={loading}
        />
        <StatCard
          icon={QrCode}
          label="QR Scans"
          value={loading ? 0 : analytics?.qrScans ?? 0}
          subtext={loading ? '' : 'this week'}
          bgColor="bg-violet-100"
          iconColor="text-violet-600"
          loading={loading}
        />
        <StatCard
          icon={StatusIcon}
          label="Menu Status"
          value={loading ? '...' : statusInfo.label}
          bgColor={statusInfo.bgColor}
          iconColor={statusInfo.color}
          loading={loading}
        />
      </div>

      {/* ===== Quick Actions ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Get started
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.page}
              action={action}
              onNavigate={setCurrentPage}
            />
          ))}
        </div>
      </div>

      {/* ===== Recent Activity ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <Clock className="h-3.5 w-3.5" />
            View all
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : activity.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {activity.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 shrink-0">
                        <Icon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gray-100 mb-4">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
                  Start by creating your menu or uploading an existing one to see activity here.
                </p>
                <Button
                  size="sm"
                  className="mt-4 bg-[#e94560] hover:bg-[#d13050] text-white text-xs"
                  onClick={() => setCurrentPage('menu-manager')}
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Create Your Menu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
