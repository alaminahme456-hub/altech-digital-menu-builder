'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, useAppStore } from '@/lib/stores'
import { adminApi } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Users,
  Building2,
  QrCode,
  BarChart3,
  Lock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Trash2,
  Loader2,
  FileText,
  LayoutTemplate,
  Eye,
} from 'lucide-react'

// ===== Types =====
interface AdminStats {
  totalUsers: number
  totalBusinesses: number
  publishedMenus: number
  totalQrScans: number
}

interface AdminBusiness {
  id: string
  name: string
  category: string
  plan: string
  status: string
  createdAt: string
}

interface AdminBusinessesResponse {
  businesses: AdminBusiness[]
  total: number
  page: number
  totalPages: number
}

// ===== Template definitions (same as DesignTemplatesPage) =====
const TEMPLATES = [
  { id: 'classic', name: 'Classic Restaurant', premium: false },
  { id: 'modern', name: 'Modern', premium: false },
  { id: 'luxury', name: 'Luxury', premium: true },
  { id: 'minimal', name: 'Minimal', premium: false },
  { id: 'fastfood', name: 'Fast Food', premium: false },
  { id: 'cafe', name: 'Café', premium: false },
  { id: 'pizza', name: 'Pizza', premium: false },
  { id: 'dark', name: 'Dark Premium', premium: true },
  { id: 'colorful', name: 'Colorful', premium: false },
  { id: 'elegant', name: 'Elegant', premium: true },
]

// ===== Stat Card Component =====
function StatCard({
  icon: Icon,
  label,
  value,
  description,
  loading,
}: {
  icon: React.ElementType
  label: string
  value: number | undefined
  description: string
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">
                {value !== undefined ? value.toLocaleString() : '—'}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Overview Tab =====
function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await adminApi.getStats()
        setStats(data)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load stats'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Failed to load platform statistics. Please try again later.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Platform Overview</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Key metrics across the entire platform
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers}
          description="Registered user accounts"
          loading={loading}
        />
        <StatCard
          icon={Building2}
          label="Total Businesses"
          value={stats?.totalBusinesses}
          description="Businesses created on the platform"
          loading={loading}
        />
        <StatCard
          icon={FileText}
          label="Published Menus"
          value={stats?.publishedMenus}
          description="Live menus being viewed by customers"
          loading={loading}
        />
        <StatCard
          icon={QrCode}
          label="Total QR Scans"
          value={stats?.totalQrScans}
          description="Cumulative QR code scans"
          loading={loading}
        />
      </div>
    </div>
  )
}

// ===== Businesses Tab =====
function BusinessesTab() {
  const [data, setData] = useState<AdminBusinessesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchBusinesses = async (page: number) => {
    try {
      setLoading(true)
      const result = await adminApi.getBusinesses(page)
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load businesses'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinesses(1)
  }, [])

  // Toggle business status
  const handleToggleStatus = async (business: AdminBusiness) => {
    const newStatus = business.status === 'active' ? 'suspended' : 'active'
    setTogglingId(business.id)
    try {
      await adminApi.updateBusiness(business.id, { status: newStatus })
      toast.success(`Business ${newStatus === 'active' ? 'activated' : 'suspended'}`)
      fetchBusinesses(data?.page || 1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      toast.error(message)
    } finally {
      setTogglingId(null)
    }
  }

  // Delete business
  const handleDelete = async (business: AdminBusiness) => {
    setDeletingId(business.id)
    try {
      await adminApi.updateBusiness(business.id, { status: 'deleted' })
      toast.success('Business deleted')
      fetchBusinesses(data?.page || 1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete business'
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const goNext = () => {
    if (data && data.page < data.totalPages) {
      fetchBusinesses(data.page + 1)
    }
  }

  const goPrev = () => {
    if (data && data.page > 1) {
      fetchBusinesses(data.page - 1)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Businesses</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} total businesses` : 'Loading...'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Mobile-friendly list for small screens, table for larger */}
          <div className="block sm:hidden">
            {loading ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : data && data.businesses.length > 0 ? (
              <div className="divide-y">
                {data.businesses.map((biz) => (
                  <div key={biz.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{biz.name}</p>
                        <p className="text-xs text-muted-foreground">{biz.category}</p>
                      </div>
                      <Badge
                        variant={biz.status === 'active' ? 'default' : 'destructive'}
                        className="shrink-0 text-xs"
                      >
                        {biz.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize text-xs">
                        {biz.plan}
                      </Badge>
                      <span>{formatDate(biz.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(biz)}
                        disabled={togglingId === biz.id}
                        className="flex-1"
                      >
                        {togglingId === biz.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : biz.status === 'active' ? (
                          <Pause className="size-3.5" />
                        ) : (
                          <Play className="size-3.5" />
                        )}
                        {biz.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingId === biz.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {deletingId === biz.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Business</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{biz.name}&quot;? This will remove
                              all associated data including menus and QR codes. This action cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(biz)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No businesses found.
              </div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data && data.businesses.length > 0 ? (
                  data.businesses.map((biz) => (
                    <TableRow key={biz.id}>
                      <TableCell className="font-medium">{biz.name}</TableCell>
                      <TableCell className="text-muted-foreground">{biz.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {biz.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={biz.status === 'active' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {biz.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(biz.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(biz)}
                            disabled={togglingId === biz.id}
                          >
                            {togglingId === biz.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : biz.status === 'active' ? (
                              <Pause className="size-3.5" />
                            ) : (
                              <Play className="size-3.5" />
                            )}
                            <span className="sr-only sm:not-sr-only">
                              {biz.status === 'active' ? 'Suspend' : 'Activate'}
                            </span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === biz.id}
                                className="text-destructive hover:text-destructive"
                              >
                                {deletingId === biz.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Business</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{biz.name}&quot;? This will
                                  remove all associated data including menus and QR codes. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(biz)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No businesses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={data.page <= 1}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={data.page >= data.totalPages}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Templates Tab =====
function TemplatesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Template Management</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage platform menu templates
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <LayoutTemplate className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Template management coming soon
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Full template editor and management capabilities are under development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template list as a management table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEMPLATES.map((tmpl) => (
                <TableRow key={tmpl.id}>
                  <TableCell className="font-medium">{tmpl.name}</TableCell>
                  <TableCell>
                    <Badge variant={tmpl.premium ? 'default' : 'outline'} className="text-xs">
                      {tmpl.premium ? 'Premium' : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled>
                      <Eye className="size-3.5" />
                      <span className="sr-only sm:not-sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Main Admin Page =====
export function AdminPage() {
  const { user } = useAuthStore()

  // Access check
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <Lock className="size-8 text-destructive" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            You don&apos;t have permission to access the admin dashboard. This area is restricted
            to platform administrators only.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Admin banner */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 flex items-center gap-3">
        <Shield className="size-5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Platform Administration</p>
          <p className="text-xs text-muted-foreground truncate">
            Manage all businesses, users, and platform settings
          </p>
        </div>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage the MenuQR platform
        </p>
      </div>

      {/* Tabbed interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            <BarChart3 className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="businesses" className="flex-1 sm:flex-none">
            <Building2 className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Businesses</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 sm:flex-none">
            <LayoutTemplate className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="businesses">
          <BusinessesTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
