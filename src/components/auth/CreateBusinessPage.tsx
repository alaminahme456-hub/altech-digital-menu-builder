'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, useAuthStore } from '@/lib/stores'
import { businessApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Upload,
  X,
  Store,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Image,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Café', label: 'Café' },
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Food Truck', label: 'Food Truck' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'Catering', label: 'Catering' },
  { value: 'Other', label: 'Other' },
]

export function CreateBusinessPage() {
  const { setCurrentPage } = useAppStore()
  const { user, setBusinesses, setCurrentBusiness } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Business name is required')
      return
    }
    if (!category) {
      toast.error('Please select a category')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('category', category)
      if (phone.trim()) formData.append('phone', phone.trim())
      if (whatsapp.trim()) formData.append('whatsapp', whatsapp.trim())
      if (address.trim()) formData.append('address', address.trim())
      if (description.trim()) formData.append('description', description.trim())
      if (openingHours.trim()) formData.append('openingHours', openingHours.trim())
      if (logoFile) formData.append('logo', logoFile)

      const business = await businessApi.create(formData)

      // Refresh businesses list
      try {
        const businesses = await businessApi.list()
        const bizList = businesses?.businesses || (Array.isArray(businesses) ? businesses : [])
        if (bizList.length > 0) {
          setBusinesses(bizList)
          const created = bizList.find((b: { id: string }) => b.id === business.business?.id) || bizList[0]
          if (created) setCurrentBusiness(created)
        }
      } catch {
        // Even if list fails, we have the created business
        setCurrentBusiness(business)
      }

      toast.success('Business created successfully!')
      setCurrentPage('dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create business. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-[#e94560]/10 mb-4">
            <Store className="h-7 w-7 text-[#e94560]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Create Your Business
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Tell us about your restaurant or food business to get started with your digital menu.
          </p>
          {user?.name && (
            <p className="text-sm text-gray-400 mt-1">
              Welcome, {user.name}!
            </p>
          )}
        </div>

        <Card className="shadow-sm border-gray-200">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Business Logo</Label>
                <p className="text-xs text-gray-400">Optional. Recommended 512x512px, max 5MB.</p>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <div className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-white">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 h-24 w-full rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-[#e94560]/40 hover:bg-[#e94560]/[0.02] transition-colors cursor-pointer"
                  >
                    <Image className="h-6 w-6 text-gray-300" />
                    <span className="text-sm text-gray-400">Click to upload logo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={loading}
                />
              </div>

              <Separator />

              {/* Business Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="biz-name" className="text-sm font-medium text-gray-700">
                    Business Name <span className="text-[#e94560]">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="biz-name"
                      placeholder="e.g., La Bella Cucina"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Category <span className="text-[#e94560]">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory} disabled={loading}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz-hours" className="text-sm font-medium text-gray-700">
                    Opening Hours
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="biz-hours"
                      placeholder="Mon-Fri 9AM-10PM"
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      className="h-11 pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="biz-phone"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-whatsapp" className="text-sm font-medium text-gray-700">
                      WhatsApp Number
                    </Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="biz-whatsapp"
                        placeholder="+1 (555) 000-0000"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="h-11 pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz-address" className="text-sm font-medium text-gray-700">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="biz-address"
                      placeholder="123 Main Street, City, State"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="biz-desc" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="biz-desc"
                  placeholder="Tell your customers about your business, cuisine, and what makes you special..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-400">A brief description helps customers find you.</p>
              </div>
            </CardContent>

            {/* Submit */}
            <div className="border-t border-gray-100 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 rounded-b-lg">
              <p className="text-xs text-gray-400 order-2 sm:order-1">
                You can always update this later in settings.
              </p>
              <div className="flex items-center gap-3 order-1 sm:order-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentPage('dashboard')}
                  disabled={loading}
                  className="text-gray-500"
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || !category}
                  className="bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white font-semibold min-w-[160px] shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Create Business
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-300 mt-6">
          &copy; {new Date().getFullYear()} ALTECH. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
