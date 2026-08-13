'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore, useMenuStore, type Category, type MenuItem } from '@/lib/stores'
import { categoryApi, itemApi, uploadApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ImageOff,
  Copy,
  Loader2,
  Check,
  UtensilsCrossed,
  FolderPlus,
  Utensils,
} from 'lucide-react'

// ===== Auto-save indicator =====
function SaveIndicator({ saving }: { saving: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {saving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-600">Saved</span>
        </>
      )}
    </div>
  )
}

// ===== Sortable Category Item =====
function SortableCategory({
  category,
  isSelected,
  itemCount,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  category: Category
  isSelected: boolean
  itemCount: number
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisibility: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer
        ${isSelected
          ? 'border-[#e94560]/40 bg-[#e94560]/5 ring-1 ring-[#e94560]/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
        ${isDragging ? 'opacity-90 shadow-lg' : ''}
      `}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Category Info */}
      <button
        className="flex-1 min-w-0 text-left"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm font-medium truncate ${category.isHidden ? 'text-muted-foreground line-through' : 'text-gray-900'}`}>
            {category.name}
          </span>
          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-4">
            {itemCount}
          </Badge>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility() }}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title={category.isHidden ? 'Show category' : 'Hide category'}
        >
          {category.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Edit category"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete category"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ===== Sortable Menu Item Card =====
function SortableMenuItemCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleAvailability,
}: {
  item: MenuItem
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleAvailability: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group transition-all duration-150 ${isDragging ? 'opacity-90 shadow-lg' : ''} ${!item.isAvailable ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Drag Handle */}
          <div className="flex flex-col items-center pt-1">
            <button
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>

          {/* Thumbnail */}
          <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                  ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`${item.imageUrl ? 'hidden' : ''} flex items-center justify-center`}>
              <ImageOff className="h-5 w-5 text-gray-300" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
              <span className="text-sm font-bold text-[#e94560] whitespace-nowrap">
                ₦{item.price.toLocaleString()}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={onToggleAvailability}
                  className="scale-75 origin-left"
                />
                <span className="text-[10px] text-muted-foreground">
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onEdit}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit item"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onDuplicate}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Duplicate item"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Item Form Inner (remounts on key change) =====
function ItemFormInner({
  item,
  onSave,
  isSaving,
  onClose,
}: {
  item: MenuItem | null
  onSave: (data: { name: string; description: string; price: number; imageFile: File | null }) => void
  isSaving: boolean
  onClose: () => void
}) {
  const [name, setName] = useState(item?.name || '')
  const [description, setDescription] = useState(item?.description || '')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.imageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedPrice = parseFloat(price)
    if (!name.trim()) {
      toast.error('Item name is required')
      return
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error('Please enter a valid price')
      return
    }
    onSave({ name: name.trim(), description: description.trim(), price: parsedPrice, imageFile })
  }

  const isEditing = !!item

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Update the details of this menu item.' : 'Add a new item to this category.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Food Image</Label>
          <div
            className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-40 object-contain rounded-md"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageFile(null)
                    setImagePreview(isEditing && item?.imageUrl ? item.imageUrl : null)
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="py-4">
                <ImageOff className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Click to upload image</p>
                <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WEBP (max 5MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="item-name">
            Item Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="item-name"
            placeholder="e.g. Jollof Rice"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="item-desc">Description</Label>
          <Textarea
            id="item-desc"
            placeholder="Brief description of the dish..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="item-price">
            Price (₦) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              ₦
            </span>
            <Input
              id="item-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pl-8"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-[#e94560] hover:bg-[#d13a54] text-white">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// ===== Item Form Dialog =====
function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MenuItem | null
  onSave: (data: { name: string; description: string; price: number; imageFile: File | null }) => void
  isSaving: boolean
}) {
  const [dialogKey, setDialogKey] = useState(0)
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (newOpen) setDialogKey((k) => k + 1)
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <ItemFormInner
        key={dialogKey}
        item={open ? item : null}
        onSave={onSave}
        isSaving={isSaving}
        onClose={() => handleOpenChange(false)}
      />
    </Dialog>
  )
}

// ===== Main MenuManagerPage Component =====
export function MenuManagerPage() {
  const { currentBusiness } = useAuthStore()
  const {
    categories,
    setCategories,
    addCategory,
    updateCategory,
    removeCategory,
    reorderCategories,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    duplicateItem,
  } = useMenuStore()

  // UI State
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Category Dialog State
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categorySaving, setCategorySaving] = useState(false)

  // Item Dialog State
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemSaving, setItemSaving] = useState(false)

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'item'; id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // DnD Sensors
  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const bizId = currentBusiness?.id
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedItems = selectedCategory?.items || []

  // ===== Trigger auto-save indicator =====
  const triggerSaving = useCallback(() => {
    setSaving(true)
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current)
    savingTimerRef.current = setTimeout(() => setSaving(false), 1500)
  }, [])

  // ===== Fetch categories on mount =====
  useEffect(() => {
    if (!bizId) return
    let cancelled = false
    setLoading(true)
    categoryApi
      .list(bizId)
      .then((data) => {
        if (cancelled) return
        // The API returns categories with items nested
        const cats: Category[] = (data.categories || data || []).map(
          (c: Record<string, unknown>, idx: number) => ({
            id: c.id,
            name: c.name,
            sortOrder: (c.sortOrder as number) ?? idx,
            isHidden: (c.isHidden as boolean) ?? false,
            items: ((c.items as MenuItem[]) || []).map((i, iIdx) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              price: i.price,
              imageUrl: i.imageUrl,
              categoryId: i.categoryId || c.id,
              sortOrder: i.sortOrder ?? iIdx,
              isAvailable: i.isAvailable ?? true,
              isHidden: i.isHidden ?? false,
            })),
          })
        )
        setCategories(cats)
        if (cats.length > 0) setSelectedCategoryId(cats[0].id)
      })
      .catch((err) => toast.error(err.message || 'Failed to load menu'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [bizId, setCategories])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current)
    }
  }, [])

  // ===== Category Handlers =====
  const handleAddCategory = async () => {
    if (!bizId || !categoryName.trim()) return
    setCategorySaving(true)
    try {
      const data = await categoryApi.create(bizId, { name: categoryName.trim() })
      const newCat: Category = {
        id: data.id || data.category?.id || crypto.randomUUID(),
        name: categoryName.trim(),
        sortOrder: categories.length,
        isHidden: false,
        items: [],
        _isNew: true,
      }
      addCategory(newCat)
      setSelectedCategoryId(newCat.id)
      setCategoryName('')
      setCategoryDialogOpen(false)
      toast.success(`Category "${newCat.name}" created`)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to create category')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!bizId || !editingCategory || !categoryName.trim()) return
    setCategorySaving(true)
    try {
      await categoryApi.update(bizId, editingCategory.id, { name: categoryName.trim() })
      updateCategory(editingCategory.id, { name: categoryName.trim() })
      setCategoryName('')
      setEditingCategory(null)
      setCategoryDialogOpen(false)
      toast.success('Category updated')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update category')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!bizId || !deleteTarget || deleteTarget.type !== 'category') return
    setDeleting(true)
    try {
      await categoryApi.delete(bizId, deleteTarget.id)
      removeCategory(deleteTarget.id)
      if (selectedCategoryId === deleteTarget.id) {
        setSelectedCategoryId(categories[0]?.id || null)
      }
      toast.success(`Category "${deleteTarget.name}" deleted`)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete category')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleCategoryVisibility = async (cat: Category) => {
    if (!bizId) return
    const newVal = !cat.isHidden
    updateCategory(cat.id, { isHidden: newVal })
    try {
      await categoryApi.update(bizId, cat.id, { isHidden: newVal })
    } catch (err) {
      updateCategory(cat.id, { isHidden: cat.isHidden })
      toast.error((err as Error).message || 'Failed to update visibility')
    }
  }

  // ===== Category DnD =====
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = categories.findIndex((c) => c.id === active.id)
    const newIdx = categories.findIndex((c) => c.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = [...categories]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)
    // Update sortOrder
    const withOrder = reordered.map((c, i) => ({ ...c, sortOrder: i }))
    reorderCategories(withOrder)
    triggerSaving()
    // Persist to backend
    if (bizId) {
      categoryApi
        .reorder(bizId, withOrder.map((c) => ({ id: c.id, sortOrder: c.sortOrder })))
        .catch(() => toast.error('Failed to save category order'))
    }
  }

  // ===== Item Handlers =====
  const handleSaveItem = async (data: { name: string; description: string; price: number; imageFile: File | null }) => {
    if (!bizId || !selectedCategoryId) return
    setItemSaving(true)
    try {
      let imageUrl: string | null = editingItem?.imageUrl || null
      // Upload image if provided
      if (data.imageFile) {
        const uploadRes = await uploadApi.upload(data.imageFile)
        imageUrl = uploadRes.url
      }
      const fd = new FormData()
      fd.append('name', data.name)
      fd.append('description', data.description)
      fd.append('price', String(data.price))
      if (imageUrl) fd.append('imageUrl', imageUrl)
      // Remove image if cleared
      if (!data.imageFile && !editingItem?.imageUrl) {
        fd.append('imageUrl', '')
      }

      if (editingItem) {
        // Update
        const updated = await itemApi.update(bizId, selectedCategoryId, editingItem.id, fd)
        updateItem(selectedCategoryId, editingItem.id, {
          name: data.name,
          description: data.description || null,
          price: data.price,
          imageUrl,
          isAvailable: editingItem.isAvailable,
        })
        toast.success('Item updated')
      } else {
        // Create
        const created = await itemApi.create(bizId, selectedCategoryId, fd)
        const newItem: MenuItem = {
          id: created.id || created.item?.id || crypto.randomUUID(),
          name: data.name,
          description: data.description || null,
          price: data.price,
          imageUrl,
          categoryId: selectedCategoryId,
          sortOrder: selectedItems.length,
          isAvailable: true,
          isHidden: false,
        }
        addItem(selectedCategoryId, newItem)
        toast.success(`"${data.name}" added`)
      }
      setItemDialogOpen(false)
      setEditingItem(null)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save item')
    } finally {
      setItemSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!bizId || !selectedCategoryId || !deleteTarget || deleteTarget.type !== 'item') return
    setDeleting(true)
    try {
      await itemApi.delete(bizId, selectedCategoryId, deleteTarget.id)
      removeItem(selectedCategoryId, deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted`)
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete item')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleDuplicateItem = (item: MenuItem) => {
    if (!selectedCategoryId) return
    duplicateItem(selectedCategoryId, item.id)
    toast.success(`"${item.name}" duplicated`)
    // Persist the new duplicated item
    const cat = categories.find((c) => c.id === selectedCategoryId)
    if (cat && bizId) {
      const idx = cat.items.findIndex((i) => i.id === item.id)
      const dup = cat.items[idx + 1]
      if (dup && dup._isNew) {
        const fd = new FormData()
        fd.append('name', dup.name)
        fd.append('description', dup.description || '')
        fd.append('price', String(dup.price))
        if (dup.imageUrl) fd.append('imageUrl', dup.imageUrl)
        itemApi.create(bizId, selectedCategoryId, fd).catch(() => {
          toast.error('Failed to save duplicated item')
        })
      }
    }
  }

  const handleToggleItemAvailability = async (item: MenuItem) => {
    if (!selectedCategoryId) return
    const newVal = !item.isAvailable
    updateItem(selectedCategoryId, item.id, { isAvailable: newVal })
    try {
      if (!bizId) return
      const fd = new FormData()
      fd.append('name', item.name)
      fd.append('description', item.description || '')
      fd.append('price', String(item.price))
      fd.append('isAvailable', String(newVal))
      if (item.imageUrl) fd.append('imageUrl', item.imageUrl)
      await itemApi.update(bizId, selectedCategoryId, item.id, fd)
    } catch (err) {
      updateItem(selectedCategoryId, item.id, { isAvailable: item.isAvailable })
      toast.error((err as Error).message || 'Failed to update availability')
    }
  }

  // ===== Item DnD =====
  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedCategoryId) return
    const oldIdx = selectedItems.findIndex((i) => i.id === active.id)
    const newIdx = selectedItems.findIndex((i) => i.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = [...selectedItems]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)
    const withOrder = reordered.map((i, idx) => ({ ...i, sortOrder: idx }))
    reorderItems(selectedCategoryId, withOrder)
    triggerSaving()
    if (bizId) {
      itemApi
        .reorder(bizId, withOrder.map((i) => ({ id: i.id, sortOrder: i.sortOrder })))
        .catch(() => toast.error('Failed to save item order'))
    }
  }

  // ===== Open edit category dialog =====
  const openEditCategoryDialog = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategoryDialogOpen(true)
  }

  const openAddCategoryDialog = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryDialogOpen(true)
  }

  // ===== Loading State =====
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Menu Manager</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and organize your menu categories and items
          </p>
        </div>
        <SaveIndicator saving={saving} />
      </div>

      <Separator />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* ===== LEFT PANEL: Categories ===== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Categories
            </h3>
            <Button
              size="sm"
              onClick={openAddCategoryDialog}
              className="bg-[#e94560] hover:bg-[#d13a54] text-white h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <FolderPlus className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">No categories yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first menu category
                </p>
                <Button
                  size="sm"
                  onClick={openAddCategoryDialog}
                  className="mt-3 bg-[#e94560] hover:bg-[#d13a54] text-white h-8 gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-220px)]">
              <DndContext
                sensors={categorySensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 pr-1">
                    {categories.map((cat) => (
                      <SortableCategory
                        key={cat.id}
                        category={cat}
                        isSelected={selectedCategoryId === cat.id}
                        itemCount={cat.items.length}
                        onSelect={() => setSelectedCategoryId(cat.id)}
                        onEdit={() => openEditCategoryDialog(cat)}
                        onDelete={() =>
                          setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })
                        }
                        onToggleVisibility={() => handleToggleCategoryVisibility(cat)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          )}
        </div>

        {/* ===== RIGHT PANEL: Items ===== */}
        <div className="space-y-3">
          {selectedCategory ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {selectedCategory.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingItem(null)
                    setItemDialogOpen(true)
                  }}
                  className="bg-[#e94560] hover:bg-[#d13a54] text-white h-8 gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>

              {selectedItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Utensils className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">No items yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your first menu item to &quot;{selectedCategory.name}&quot;
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingItem(null)
                        setItemDialogOpen(true)
                      }}
                      className="mt-3 bg-[#e94560] hover:bg-[#d13a54] text-white h-8 gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-220px)]">
                  <DndContext
                    sensors={itemSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleItemDragEnd}
                  >
                    <SortableContext
                      items={selectedItems.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 pr-1">
                        {selectedItems.map((item) => (
                          <SortableMenuItemCard
                            key={item.id}
                            item={item}
                            onEdit={() => {
                              setEditingItem(item)
                              setItemDialogOpen(true)
                            }}
                            onDuplicate={() => handleDuplicateItem(item)}
                            onDelete={() =>
                              setDeleteTarget({ type: 'item', id: item.id, name: item.name })
                            }
                            onToggleAvailability={() => handleToggleItemAvailability(item)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Select a category</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a category from the left to view and manage its items
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== Category Add/Edit Dialog ===== */}
      <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
        setCategoryDialogOpen(open)
        if (!open) { setEditingCategory(null); setCategoryName('') }
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Rename Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Enter a new name for this category.'
                : 'Categories help organize your menu items.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editingCategory) handleUpdateCategory()
              else handleAddCategory()
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g. Main Dishes"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
                disabled={categorySaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={categorySaving || !categoryName.trim()}
                className="bg-[#e94560] hover:bg-[#d13a54] text-white"
              >
                {categorySaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Item Add/Edit Dialog ===== */}
      <ItemFormDialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          setItemDialogOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        onSave={handleSaveItem}
        isSaving={itemSaving}
      />

      {/* ===== Delete Confirmation Dialog ===== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'category' ? 'Category' : 'Item'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              {deleteTarget?.type === 'category' && (
                <span className="block mt-1 text-red-500 font-medium">
                  This will also delete all {categories.find((c) => c.id === deleteTarget?.id)?.items.length || 0} items in this category.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === 'category') handleDeleteCategory()
                else handleDeleteItem()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}