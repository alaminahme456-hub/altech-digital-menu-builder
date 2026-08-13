'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, useAuthStore } from '@/lib/stores'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Eye,
  QrCode,
  Calendar,
  CalendarDays,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react'

// ===== Constants =====
const COLORS = ['#e94560', '#1a1a2e', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#14B8A6']

// ===== Types =====
interface AnalyticsData {
  totalViews: number
  totalScans: number
  viewsToday: number
  viewsWeek: number
  viewsMonth: number
  mostViewedItems: { name: string; views: number; category?: string }[]
  mostViewedCategories: { name: string; views: number }[]
  dailyViews: { date: string; views: number }[]
}

// ===== Stat Card =====
interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number
  bgColor: string
  iconColor: string
  loading: boolean
}

function StatCard({ icon: Icon, label, value, bgColor, iconColor, loading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {value.toLocaleString()}
              </p>
            )}
          </div>
          <div
            className={`flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-xl ${bgColor} shrink-0`}
          >
            <Icon className={`h-5 w-5 md:h-6 md:w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Custom Tooltip =====
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{payload[0].value.toLocaleString()} views</p>
    </div>
  )
}

// ===== Main AnalyticsPage Component =====
export function AnalyticsPage() {
  const { setCurrentPage } = useAppStore()
  const { currentBusiness } = useAuthStore()

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const businessId = currentBusiness?.id

  const fetchData = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await analyticsApi.get(businessId)
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Check if there's genuinely no data (all zeros and empty arrays)
  const hasNoData =
    analytics &&
    analytics.totalViews === 0 &&
    analytics.totalScans === 0 &&
    analytics.viewsToday === 0 &&
    analytics.viewsMonth === 0 &&
    (!analytics.mostViewedItems || analytics.mostViewedItems.length === 0) &&
    (!analytics.dailyViews || analytics.dailyViews.length === 0)

  // ===== Empty State =====
  if (!loading && hasNoData) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track how customers interact with your menu
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-5">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No analytics data yet</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-md leading-relaxed">
              Publish your menu and share your QR code to start tracking views and scans.
            </p>
            <Button
              onClick={() => setCurrentPage('qr-code')}
              className="mt-6 bg-[#e94560] hover:bg-[#d13050] text-white gap-2"
            >
              <QrCode className="h-4 w-4" />
              Go to QR Code
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== Error State =====
  if (!loading && error) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track how customers interact with your menu
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
              <BarChart3 className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Failed to load analytics</h3>
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
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track how customers interact with your menu
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={analytics?.totalViews ?? 0}
          bgColor="bg-sky-100"
          iconColor="text-sky-600"
          loading={loading}
        />
        <StatCard
          icon={QrCode}
          label="QR Scans"
          value={analytics?.totalScans ?? 0}
          bgColor="bg-violet-100"
          iconColor="text-violet-600"
          loading={loading}
        />
        <StatCard
          icon={Calendar}
          label="Views Today"
          value={analytics?.viewsToday ?? 0}
          bgColor="bg-amber-100"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          icon={CalendarDays}
          label="Views This Month"
          value={analytics?.viewsMonth ?? 0}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Views Over Time - Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#e94560]" />
              Views Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : !analytics?.dailyViews?.length ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No daily data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.dailyViews} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e94560" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e94560" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(val: string) => {
                      const parts = val.split('-')
                      return parts.length >= 3
                        ? `${parts[1]}/${parts[2]}`
                        : val
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#e94560"
                    strokeWidth={2}
                    fill="url(#viewGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Categories - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#e94560]" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : !analytics?.mostViewedCategories?.length ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No category data available
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={200} className="max-w-[200px] mx-auto lg:mx-0">
                  <PieChart>
                    <Pie
                      data={analytics.mostViewedCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="views"
                      nameKey="name"
                    >
                      {analytics.mostViewedCategories.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString(), 'Views']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 max-h-[120px] overflow-y-auto">
                  {analytics.mostViewedCategories.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-gray-700 truncate flex-1">{cat.name}</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {cat.views.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Most Viewed Items Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Most Viewed Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !analytics?.mostViewedItems?.length ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                No item data available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-xs text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.mostViewedItems.slice(0, 10).map((item, idx) => (
                    <TableRow key={item.name + idx}>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {item.category || '—'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {item.views.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : analytics?.dailyViews && analytics.dailyViews.length > 0 ? (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {analytics.dailyViews
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 shrink-0">
                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {day.views.toLocaleString()} views
                        </p>
                        <p className="text-xs text-muted-foreground">{day.date}</p>
                      </div>
                      {day.views > 0 && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <TrendingUp className="h-3 w-3" />
                          {day.views}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground">No recent activity to show</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
