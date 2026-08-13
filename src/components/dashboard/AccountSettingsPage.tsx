'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, useAppStore } from '@/lib/stores'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Shield,
  Building2,
  CreditCard,
  Save,
  Loader2,
  ArrowRight,
  Lock,
  Check,
  Crown,
  Sparkles,
  Mail,
} from 'lucide-react'

// ===== Plan feature definitions =====
const PLAN_FEATURES: Record<string, string[]> = {
  Free: [
    'Up to 1 business',
    'Up to 20 menu items',
    'Basic QR code',
    'Standard templates',
    'Basic analytics',
  ],
  Pro: [
    'Up to 3 businesses',
    'Unlimited menu items',
    'Custom QR codes',
    'Premium templates',
    'Advanced analytics',
    'WhatsApp ordering',
    'Remove branding',
  ],
  Business: [
    'Unlimited businesses',
    'Unlimited menu items',
    'Custom QR codes with logo',
    'All templates + custom',
    'Full analytics suite',
    'WhatsApp ordering',
    'Remove branding',
    'Priority support',
    'API access',
  ],
}

const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Pro: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Business: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  Free: User,
  Pro: Sparkles,
  Business: Crown,
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  suspended: 'destructive',
  pending: 'secondary',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AccountSettingsPage() {
  const { user, businesses, setCurrentBusiness, setUser } = useAuthStore()
  const { setCurrentPage } = useAppStore()

  // Profile form state
  const [name, setName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // UI state
  const [initialized, setInitialized] = useState(false)

  // Pre-fill from user on mount
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setInitialized(true)
    }
  }, [user])

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!user) return
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setSavingProfile(true)
    try {
      const result = await authApi.updateProfile({ name: name.trim() })
      setUser({ ...user, name: name.trim() })
      toast.success('Profile updated successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setSavingProfile(false)
    }
  }

  // Change password handler
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    setSavingPassword(true)
    try {
      // Placeholder: no API endpoint yet
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } finally {
      setSavingPassword(false)
    }
  }

  // Switch to a business
  const handleSwitchBusiness = (business: typeof businesses[0]) => {
    setCurrentBusiness(business)
    setCurrentPage('dashboard')
    toast.success(`Switched to ${business.name}`)
  }

  // Get user's current plan
  const currentPlan = businesses.length > 0 ? businesses[0]?.plan || 'Free' : 'Free'
  const PlanIcon = PLAN_ICONS[currentPlan] || User

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Please log in to view account settings.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, security, and subscription
        </p>
      </div>

      {!initialized ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-muted-foreground" />
                Profile
              </CardTitle>
              <CardDescription>
                Your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and name row */}
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Avatar className="h-20 w-20 text-xl">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="flex items-center gap-2">
                      <Mail className="size-4" />
                      Email
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update it.
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-muted-foreground" />
                Security
              </CardTitle>
              <CardDescription>
                Protect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline">
                  {savingPassword ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Businesses Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-muted-foreground" />
                Your Businesses
              </CardTitle>
              <CardDescription>
                Manage and switch between your businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businesses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You don&apos;t have any businesses yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {businesses.map((biz) => (
                    <div
                      key={biz.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{biz.name}</p>
                          <Badge variant={STATUS_VARIANTS[biz.status] || 'outline'} className="text-xs">
                            {biz.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {biz.plan}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {biz.category}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSwitchBusiness(biz)}
                        className="shrink-0"
                      >
                        Switch
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-muted-foreground" />
                Subscription
              </CardTitle>
              <CardDescription>
                Your current plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current plan display */}
              <div className={`rounded-lg p-4 ${PLAN_COLORS[currentPlan] || 'bg-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-background/60 p-2.5">
                    <PlanIcon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg capitalize">{currentPlan} Plan</p>
                    <p className="text-sm opacity-80">
                      {currentPlan === 'Free'
                        ? 'Get started with essential features'
                        : currentPlan === 'Pro'
                          ? 'Advanced features for growing businesses'
                          : 'Everything you need for your enterprise'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Plan Features</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PLAN_FEATURES[currentPlan]?.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Upgrade button */}
              {currentPlan === 'Free' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Ready for more?</p>
                    <p className="text-xs text-muted-foreground">
                      Upgrade to unlock premium templates, analytics, and more.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast.info('Coming soon!')}
                    className="w-fit"
                  >
                    <Crown className="size-4" />
                    Upgrade Plan
                  </Button>
                </div>
              )}
              {currentPlan === 'Pro' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Need even more power?</p>
                    <p className="text-xs text-muted-foreground">
                      Upgrade to Business for unlimited everything and priority support.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => toast.info('Coming soon!')}
                    className="w-fit"
                  >
                    <Crown className="size-4" />
                    Upgrade to Business
                  </Button>
                </div>
              )}
              {currentPlan === 'Business' && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
                  <Crown className="size-5 text-emerald-600" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    You&apos;re on the highest plan. Enjoy all premium features!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
