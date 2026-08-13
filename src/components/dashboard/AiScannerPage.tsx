'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuthStore, useAiScanStore, useMenuStore, type DetectedItem } from '@/lib/stores'
import { useAppStore } from '@/lib/stores'
import { aiScanApi, categoryApi, itemApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  CloudUpload,
  Loader2,
  ScanLine,
  Trash2,
  Plus,
  ArrowLeft,
  Save,
  X,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ===== Common Categories =====
const COMMON_CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Soups',
  'Salads',
  'Burgers',
  'Pizza',
  'Pasta',
  'Rice Dishes',
  'Grills & BBQ',
  'Sides',
  'Desserts',
  'Beverages',
  'Smoothies',
  'Coffee & Tea',
  'Alcoholic Drinks',
  'Breakfast',
  'Snacks',
  'Swallow & Soups',
  'Proteins',
  'Others',
]

// AI scanning is handled server-side in the API route

// ===== Step type =====
type Step = 'upload' | 'scanning' | 'review'

// ===== Detected Item Row =====
function DetectedItemRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: DetectedItem
  index: number
  onUpdate: (idx: number, data: Partial<DetectedItem>) => void
  onRemove: (idx: number) => void
}) {
  const isCommonCategory = COMMON_CATEGORIES.includes(item.category)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Index Badge */}
          <div className="hidden sm:flex h-8 w-8 rounded-lg bg-gray-100 items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-gray-500">{index + 1}</span>
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3">
            {/* Name */}
            <div className="lg:col-span-3">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Name</Label>
              <Input
                value={item.name}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
                placeholder="Item name"
                className="h-9 text-sm"
              />
            </div>

            {/* Category */}
            <div className="lg:col-span-3">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Category</Label>
              <Select
                value={isCommonCategory ? item.category : '__custom__'}
                onValueChange={(val) => {
                  if (val !== '__custom__') {
                    onUpdate(index, { category: val })
                  }
                }}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder={isCommonCategory ? item.category : 'Custom category'} />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isCommonCategory && (
                <Input
                  value={item.category}
                  onChange={(e) => onUpdate(index, { category: e.target.value })}
                  placeholder="Custom category"
                  className="h-8 text-xs mt-1"
                />
              )}
            </div>

            {/* Description */}
            <div className="lg:col-span-3">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Description</Label>
              <Input
                value={item.description}
                onChange={(e) => onUpdate(index, { description: e.target.value })}
                placeholder="Brief description"
                className="h-9 text-sm"
              />
            </div>

            {/* Price */}
            <div className="lg:col-span-2">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Price</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  ₦
                </span>
                <Input
                  type="number"
                  min={0}
                  value={item.price || ''}
                  onChange={(e) =>
                    onUpdate(index, { price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="h-9 text-sm pl-7"
                />
              </div>
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-600 shrink-0 mt-5"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main Component =====
export function AiScannerPage() {
  const { currentBusiness } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const {
    isScanning,
    detectedItems,
    setScanning,
    setDetectedItems,
    updateDetectedItem,
    removeDetectedItem,
    addDetectedItem,
    resetScan,
  } = useAiScanStore()
  const { addCategory, addItem } = useMenuStore()

  const bizId = currentBusiness?.id

  // Local state
  const [step, setStep] = useState<Step>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  const MAX_SIZE = 10 * 1024 * 1024
  const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf'

  // ===== File Validation =====
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.'
    }
    if (file.size > MAX_SIZE) {
      return 'File is too large. Maximum size is 10MB.'
    }
    return null
  }, [])

  // ===== Handle File Selection =====
  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setSelectedFile(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => setImagePreview(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        setImagePreview(null)
      }
    },
    [validateFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  // ===== Scan Handler =====
  const handleScan = async () => {
    if (!selectedFile || !bizId) return

    setStep('scanning')
    setScanning(true)

    try {
      const result = await aiScanApi.upload(bizId, selectedFile)
      const rawItems = result.items || []

      const items: DetectedItem[] = rawItems
        .map((raw: any) => ({
          name: String(raw.name || ''),
          description: String(raw.description || ''),
          price: typeof raw.price === 'number' ? raw.price : 0,
          category: String(raw.category || 'Others'),
        }))
        .filter((d: DetectedItem) => d.name.trim() !== '')

      if (items.length === 0) {
        toast.error('No menu items detected. Please try a clearer photo.')
        setScanning(false)
        setStep('upload')
        return
      }

      setDetectedItems(items)
      setStep('review')
      toast.success(`Detected ${items.length} menu items!`)
    } catch (err) {
      console.error('AI scan error:', err)
      toast.error('Failed to scan menu. Please try again with a clearer photo.')
      setStep('upload')
    } finally {
      setScanning(false)
    }
  }

  // ===== Save to Menu =====
  const handleSave = async () => {
    if (!bizId || detectedItems.length === 0) return

    setSaving(true)
    try {
      const grouped = new Map<string, DetectedItem[]>()
      detectedItems.forEach((item) => {
        const cat = item.category.trim() || 'Others'
        if (!grouped.has(cat)) grouped.set(cat, [])
        grouped.get(cat)!.push(item)
      })

      let categoriesCreated = 0
      let itemsCreated = 0

      for (const [catName, items] of grouped) {
        const cat = await categoryApi.create(bizId, { name: catName })
        const categoryId = cat.id || cat.category?.id
        if (!categoryId) continue

        categoriesCreated++
        addCategory({
          id: categoryId,
          name: catName,
          sortOrder: 0,
          isHidden: false,
          items: [],
          _isNew: true,
        })

        for (const item of items) {
          const fd = new FormData()
          fd.append('name', item.name)
          fd.append('description', item.description)
          fd.append('price', String(item.price))

          try {
            const created = await itemApi.create(bizId, categoryId, fd)
            const itemId = created.id || created.item?.id
            if (itemId) {
              itemsCreated++
              addItem(categoryId, {
                id: itemId,
                name: item.name,
                description: item.description || null,
                price: item.price,
                imageUrl: null,
                categoryId,
                sortOrder: 0,
                isAvailable: true,
                isHidden: false,
                _isNew: true,
              })
            }
          } catch (itemErr) {
            console.error('Failed to create item:', item.name, itemErr)
          }
        }
      }

      toast.success(
        `Saved to menu! ${categoriesCreated} ${categoriesCreated === 1 ? 'category' : 'categories'} and ${itemsCreated} ${itemsCreated === 1 ? 'item' : 'items'} created.`,
        { duration: 5000 }
      )

      resetScan()
      setSelectedFile(null)
      setImagePreview(null)
      setCurrentPage('menu-manager')
    } catch (err) {
      console.error('Save error:', err)
      toast.error((err as Error).message || 'Failed to save items to menu')
    } finally {
      setSaving(false)
    }
  }

  // ===== Reset to Upload =====
  const handleRescan = () => {
    resetScan()
    setSelectedFile(null)
    setImagePreview(null)
    setStep('upload')
  }

  // ===== Render =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Menu Scanner</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload a photo of your menu and let AI do the work
          </p>
        </div>
        {step === 'review' && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRescan}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Re-scan</span>
          </Button>
        )}
      </div>

      <Separator />

      <AnimatePresence mode="wait">
        {/* ===== STEP: Upload ===== */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {!selectedFile ? (
              <>
                {/* Upload Dropzone */}
                <Card className="border-dashed border-2">
                  <CardContent className="p-0">
                    <div
                      className={`relative flex flex-col items-center justify-center py-16 px-6 rounded-lg transition-all duration-200 cursor-pointer
                        ${isDragging ? 'bg-[#e94560]/5 border-[#e94560]/30' : 'hover:bg-gray-50'}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <CloudUpload
                          className={`h-8 w-8 transition-colors ${isDragging ? 'text-[#e94560]' : 'text-gray-400'}`}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Upload Menu Photo</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-md">
                        Our AI will scan your menu and detect items, prices, and categories
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        {['JPG', 'PNG', 'WEBP', 'PDF'].map((fmt) => (
                          <span
                            key={fmt}
                            className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">Max file size: 10MB</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4.5 w-4.5 text-violet-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">AI-Powered</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Advanced vision AI extracts items, prices, and categories automatically.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <ScanLine className="h-4.5 w-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Instant Results</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Get your menu items detected in seconds, not hours.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4.5 w-4.5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Review & Edit</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Review detected items, make corrections, then save to your menu.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {imagePreview ? (
                        <ImageIcon className="h-4.5 w-4.5 text-emerald-600" />
                      ) : (
                        <Upload className="h-4.5 w-4.5 text-amber-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => {
                        setSelectedFile(null)
                        setImagePreview(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {imagePreview && (
                    <div className="relative w-full bg-gray-50 rounded-lg border overflow-hidden max-h-[400px]">
                      <img
                        src={imagePreview}
                        alt="Menu Preview"
                        className="w-full max-h-[400px] object-contain"
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSelectedFile(null)
                        setImagePreview(null)
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Choose Different File
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-[#e94560] hover:bg-[#d63851] text-white"
                      onClick={handleScan}
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ===== STEP: Scanning ===== */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <motion.div
                      className="h-20 w-20 rounded-full border-4 border-gray-200"
                      style={{ borderTopColor: '#e94560' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="h-8 w-8 text-[#e94560]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">AI is analyzing your menu...</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Our AI vision model is reading your menu, detecting items, prices, and
                      categories. This usually takes a few seconds.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {['Reading image', 'Detecting items', 'Extracting prices', 'Categorizing'].map(
                      (label, i) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.8, duration: 0.5 }}
                        >
                          <Badge variant="secondary" className="text-xs gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {label}
                          </Badge>
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ===== STEP: Review Results ===== */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Success Banner */}
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800">
                  AI detected {detectedItems.length} menu{' '}
                  {detectedItems.length === 1 ? 'item' : 'items'}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Review and edit the detected items below before saving to your menu.
                </p>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  addDetectedItem({ name: '', description: '', price: 0, category: 'Others' })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setDetectedItems([])
                  toast.success('All items cleared')
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 ml-auto"
                onClick={handleRescan}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Re-scan
              </Button>
            </div>

            {/* Items List */}
            {detectedItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No items to save</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add items manually or re-scan your menu photo.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {detectedItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                  >
                    <DetectedItemRow
                      item={item}
                      index={idx}
                      onUpdate={updateDetectedItem}
                      onRemove={removeDetectedItem}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Save Button */}
            {detectedItems.length > 0 && (
              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t pt-4 pb-1 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {detectedItems.length} {detectedItems.length === 1 ? 'item' : 'items'} ready
                  </p>
                  <Button
                    className="gap-2 bg-[#e94560] hover:bg-[#d63851] text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save to Menu'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
