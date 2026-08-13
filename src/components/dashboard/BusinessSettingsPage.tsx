'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore, useAppStore } from '@/lib/stores'
import { businessApi, uploadApi } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Building2,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ImageIcon,
  Upload,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'

const CATEGORIES = [
  'Restaurant',
  'Café',
  'Hotel',
  'Bar',
  'Food Truck',
  'Bakery',
  'Catering',
  'Other',
]

export function BusinessSettingsPage() {
  const { currentBusiness, businesses, setCurrentBusiness, logout, setUser, setBusinesses } = useAuthStore()
  const { setCurrentPage } = useAppStore()

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-fill form from currentBusiness on mount
  useEffect(() => {
    if (currentBusiness) {
      setName(currentBusiness.name || '')
      setCategory(currentBusiness.category || '')
      setDescription(currentBusiness.description || '')
      setPhone(currentBusiness.phone || '')
      setWhatsapp(currentBusiness.whatsapp || '')
      setAddress(currentBusiness.address || '')
      setOpeningHours(currentBusiness.openingHours || '')
      setLogoUrl(currentBusiness.logoUrl || null)
      setInitialized(true)
    }
  }, [currentBusiness])

  // Save handler
  const handleSave = async () => {
    if (!currentBusiness) return
    if (!name.trim()) {
      toast.error('Business name is required')
      return
    }

    setSaving(true)
    try {
      const data: Record<string, unknown> = {
        name: name.trim(),
        category,
        description,
        phone,
        whatsapp,
        address,
        openingHours,
      }
      // If logo was changed, include new logo URL
      if (logoUrl !== (currentBusiness.logoUrl || null)) {
        data.logoUrl = logoUrl || ''
      }

      const updated = await businessApi.update(currentBusiness.id, data)

      // Update store with returned data
      const updatedBusiness = { ...currentBusiness, ...updated.business }
      setCurrentBusiness(updatedBusiness)
      const bizIndex = businesses.findIndex((b) => b.id === currentBusiness.id)
      if (bizIndex >= 0) {
        const newBusinesses = [...businesses]
        newBusinesses[bizIndex] = updatedBusiness
        setBusinesses(newBusinesses)
      }

      toast.success('Business settings saved successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const result = await uploadApi.upload(file)
      setLogoUrl(result.url)
      toast.success('Logo uploaded successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload logo'
      toast.error(message)
    } finally {
      setUploadingLogo(false)
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Remove logo handler
  const handleRemoveLogo = () => {
    setLogoUrl(null)
    toast.success('Logo removed')
  }

  // Delete business handler
  const handleDelete = async () => {
    if (!currentBusiness) return

    setDeleting(true)
    try {
      await businessApi.delete(currentBusiness.id)
      toast.success('Business deleted successfully')

      const remaining = businesses.filter((b) => b.id !== currentBusiness.id)
      if (remaining.length > 0) {
        setBusinesses(remaining)
        setCurrentBusiness(remaining[0])
        setCurrentPage('dashboard')
      } else {
        setBusinesses([])
        setCurrentBusiness(null)
        logout()
        setCurrentPage('landing')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete business'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  if (!currentBusiness) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your business details</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No business selected. Please select a business first.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page header with sticky save */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your business details and preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {!initialized ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Business Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-muted-foreground" />
                Business Information
              </CardTitle>
              <CardDescription>
                Basic information about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business-name"
                  placeholder="Enter your business name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full" id="business-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-description">Description</Label>
                <Textarea
                  id="business-description"
                  placeholder="Describe your business..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="size-5 text-muted-foreground" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How customers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number" className="flex items-center gap-2">
                  <MessageCircle className="size-4" />
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your business address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-muted-foreground" />
                Opening Hours
              </CardTitle>
              <CardDescription>
                Your operating schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opening-hours">Hours</Label>
                <Textarea
                  id="opening-hours"
                  placeholder="Mon-Fri: 9AM-10PM, Sat-Sun: 10AM-11PM"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Example: Mon-Fri: 9AM-10PM, Sat-Sun: 10AM-11PM
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Logo Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-5 text-muted-foreground" />
                Business Logo
              </CardTitle>
              <CardDescription>
                Your business logo displayed on the menu and QR code page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current logo */}
              {logoUrl && (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    <img
                      src={logoUrl}
                      alt="Business logo"
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Current Logo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-destructive hover:text-destructive w-fit"
                    >
                      <X className="size-4" />
                      Remove Logo
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload button */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  aria-label="Upload logo"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-fit"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      {logoUrl ? 'Replace Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or SVG. Max 2MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Delete this business</p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    This will permanently delete your business, menu, QR code, and all
                    data. This action cannot be undone.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto shrink-0"
                    >
                      <Trash2 className="size-4" />
                      Delete Business
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{currentBusiness.name}&quot;,
                        including all menus, QR codes, analytics data, and associated
                        resources. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Yes, delete this business'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
