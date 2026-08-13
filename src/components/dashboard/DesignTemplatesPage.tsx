'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, useDesignStore } from '@/lib/stores'
import { useAppStore } from '@/lib/stores'
import { designApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Palette,
  Check,
  Eye,
  Loader2,
  Save,
  Crown,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'

// ===== Template Definitions =====
interface TemplateDef {
  id: string
  name: string
  colors: { primary: string; bg: string }
  isPremium: boolean
}

const TEMPLATES: TemplateDef[] = [
  { id: 'classic', name: 'Classic Restaurant', colors: { primary: '#8B4513', bg: '#FFF8F0' }, isPremium: false },
  { id: 'modern', name: 'Modern', colors: { primary: '#1a1a2e', bg: '#ffffff' }, isPremium: false },
  { id: 'luxury', name: 'Luxury', colors: { primary: '#B8860B', bg: '#FFFEF5' }, isPremium: true },
  { id: 'minimal', name: 'Minimal', colors: { primary: '#333333', bg: '#fafafa' }, isPremium: false },
  { id: 'fastfood', name: 'Fast Food', colors: { primary: '#FF6B35', bg: '#FFF5F0' }, isPremium: false },
  { id: 'cafe', name: 'Café', colors: { primary: '#6F4E37', bg: '#FDF8F0' }, isPremium: false },
  { id: 'pizza', name: 'Pizza', colors: { primary: '#C41E3A', bg: '#FFF8F8' }, isPremium: false },
  { id: 'dark', name: 'Dark Premium', colors: { primary: '#C9A96E', bg: '#1a1a1a' }, isPremium: true },
  { id: 'colorful', name: 'Colorful', colors: { primary: '#FF6B6B', bg: '#FFF0F0' }, isPremium: false },
  { id: 'elegant', name: 'Elegant', colors: { primary: '#2C3E50', bg: '#ECF0F1' }, isPremium: true },
]

// ===== Template Preview Card =====
function TemplatePreview({
  template,
  isActive,
  onSelect,
}: {
  template: TemplateDef
  isActive: boolean
  onSelect: (t: TemplateDef) => void
}) {
  const isDark = template.id === 'dark'
  const textOnBg = isDark ? '#ccc' : '#555'
  const lineColor = isDark ? '#333' : '#e0e0e0'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group ${
          isActive ? 'ring-2 ring-[#e94560] shadow-md' : 'hover:ring-1 hover:ring-gray-300'
        }`}
        onClick={() => onSelect(template)}
      >
        {/* Preview Thumbnail */}
        <div className="h-48 relative overflow-hidden" style={{ backgroundColor: template.colors.bg }}>
          {/* Header bar */}
          <div
            className="h-8 w-full"
            style={{ backgroundColor: template.colors.primary }}
          />
          {/* Mock menu items */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Category label */}
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: template.colors.primary }}
            >
              Main Course
            </div>
            {/* Item 1 */}
            <div className="space-y-1">
              <div
                className="h-2.5 rounded-sm w-3/4"
                style={{ backgroundColor: textOnBg, opacity: 0.7 }}
              />
              <div
                className="h-1.5 rounded-sm w-1/2"
                style={{ backgroundColor: lineColor }}
              />
              <div
                className="h-1.5 rounded-sm w-1/4 self-end"
                style={{ backgroundColor: textOnBg, opacity: 0.4 }}
              />
            </div>
            {/* Item 2 */}
            <div className="space-y-1">
              <div
                className="h-2.5 rounded-sm w-2/3"
                style={{ backgroundColor: textOnBg, opacity: 0.7 }}
              />
              <div
                className="h-1.5 rounded-sm w-2/5"
                style={{ backgroundColor: lineColor }}
              />\n              <div
                className="h-1.5 rounded-sm w-1/5 self-end"
                style={{ backgroundColor: textOnBg, opacity: 0.4 }}
              />
            </div>
          </div>

          {/* Active checkmark overlay */}
          {isActive && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#e94560] flex items-center justify-center shadow-lg">
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
          )}

          {/* Premium badge */}
          {template.isPremium && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1 px-1.5 py-0">
                <Crown className="h-2.5 w-2.5" />
                Premium
              </Badge>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 truncate">{template.name}</span>
            <Button
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              className={`h-7 text-xs px-2.5 ${
                isActive
                  ? 'bg-[#e94560] hover:bg-[#d63851] text-white'
                  : 'opacity-0 group-hover:opacity-100 transition-opacity'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(template)
              }}
            >
              {isActive ? 'Active' : 'Use Template'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Main Component =====
export function DesignTemplatesPage() {
  const { currentBusiness } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const {
    templateId,
    primaryColor,
    secondaryColor,
    fontStyle,
    backgroundStyle,
    logoPosition,
    menuLayout,
    whatsappEnabled,
    whatsappNumber,
    seoEnabled,
    setDesign,
  } = useDesignStore()

  const bizId = currentBusiness?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDef | null>(null)

  // ===== Fetch existing design on mount =====
  useEffect(() => {
    if (!bizId) return
    let cancelled = false
    setLoading(true)
    designApi
      .get(bizId)
      .then((data) => {
        if (cancelled) return
        if (data) {
          setDesign({
            templateId: data.templateId || null,
            primaryColor: data.primaryColor || '#1a1a2e',
            secondaryColor: data.secondaryColor || '#e94560',
            fontStyle: data.fontStyle || 'modern',
            backgroundStyle: data.backgroundStyle || 'light',
            logoPosition: data.logoPosition || 'top-center',
            menuLayout: data.menuLayout || 'grid',
            whatsappEnabled: data.whatsappEnabled ?? false,
            whatsappNumber: data.whatsappNumber || '',
            seoEnabled: data.seoEnabled ?? true,
          })
          // Pre-select template if it matches
          if (data.templateId) {
            const found = TEMPLATES.find((t) => t.id === data.templateId)
            if (found) setSelectedTemplate(found)
          }
        }
      })
      .catch(() => {
        // No design saved yet, use defaults
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [bizId, setDesign])

  // ===== Handle Template Select =====
  const handleTemplateSelect = (template: TemplateDef) => {
    setSelectedTemplate(template)
    setDesign({
      templateId: template.id,
      primaryColor: template.colors.primary,
    })
  }

  // ===== Handle Save =====
  const handleSave = async () => {
    if (!bizId) return
    setSaving(true)
    try {
      await designApi.update(bizId, {
        templateId: templateId,
        primaryColor,
        secondaryColor,
        fontStyle,
        backgroundStyle,
        logoPosition,
        menuLayout,
        whatsappEnabled,
        whatsappNumber,
        seoEnabled,
      })
      toast.success('Design saved successfully!')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save design')
    } finally {
      setSaving(false)
    }
  }

  // ===== Loading State =====
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Separator />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Design Templates</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a template and customize the look of your digital menu
        </p>
      </div>

      <Separator />

      {/* ===== Template Grid ===== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Choose a Template</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {TEMPLATES.map((template) => (
            <TemplatePreview
              key={template.id}
              template={template}
              isActive={selectedTemplate?.id === template.id || templateId === template.id}
              onSelect={handleTemplateSelect}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* ===== Customization Panel ===== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Customize Design</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Colors Section */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Colors</h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-700 w-32 shrink-0">Primary Color</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setDesign({ primaryColor: e.target.value })}
                      className="h-9 w-12 rounded-md border cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setDesign({ primaryColor: e.target.value })}
                      className="h-9 text-sm font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-700 w-32 shrink-0">Secondary Color</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setDesign({ secondaryColor: e.target.value })}
                      className="h-9 w-12 rounded-md border cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setDesign({ secondaryColor: e.target.value })}
                      className="h-9 text-sm font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography & Layout Section */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Layout & Typography</h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-700 w-32 shrink-0">Font Style</Label>
                  <Select value={fontStyle} onValueChange={(v) => setDesign({ fontStyle: v })}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="elegant">Elegant</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-700 w-32 shrink-0">Background</Label>
                  <Select value={backgroundStyle} onValueChange={(v) => setDesign({ backgroundStyle: v })}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cool">Cool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-700 w-32 shrink-0">Logo Position</Label>
                  <Select value={logoPosition} onValueChange={(v) => setDesign({ logoPosition: v })}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-700 w-32 shrink-0">Menu Layout</Label>
                  <Select value={menuLayout} onValueChange={(v) => setDesign({ menuLayout: v })}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Settings</h4>

              <div className="space-y-4">
                {/* WhatsApp Toggle */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm text-gray-700">WhatsApp Ordering</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Let customers order via WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={whatsappEnabled}
                      onCheckedChange={(checked) => setDesign({ whatsappEnabled: checked })}
                    />
                  </div>

                  {whatsappEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Input
                        value={whatsappNumber}
                        onChange={(e) => setDesign({ whatsappNumber: e.target.value })}
                        placeholder="e.g. +2348012345678"
                        className="h-9 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Include country code (e.g., +234 for Nigeria)
                      </p>
                    </motion.div>
                  )}
                </div>

                <Separator />

                {/* SEO Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm text-gray-700">SEO Indexing</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Allow search engines to index your menu
                    </p>
                  </div>
                  <Switch
                    checked={seoEnabled}
                    onCheckedChange={(checked) => setDesign({ seoEnabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== Action Buttons ===== */}
      <Separator />
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-end pb-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setCurrentPage('preview')}
        >
          <Eye className="h-4 w-4" />
          Preview with Template
        </Button>
        <Button
          className="gap-2 bg-[#e94560] hover:bg-[#d63851] text-white min-w-[140px]"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Design'}
        </Button>
      </div>
    </div>
  )
}
