'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores'
import { useAppStore } from '@/lib/stores'
import { menuUploadApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Eye,
  RefreshCw,
  Globe,
  GlobeLock,
  CheckCircle2,
  Loader2,
  CloudUpload,
  X,
  ArrowRight,
} from 'lucide-react'

// ===== Types =====
interface MenuUpload {
  id: string
  fileUrl: string
  fileType: string
  fileName: string
  fileSize: number
  status: 'draft' | 'published' | 'unpublished'
  createdAt: string
}

// ===== Status Badge =====
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    published: {
      label: 'Published',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    unpublished: {
      label: 'Unpublished',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  }
  const cfg = config[status] || config.draft
  return (
    <Badge variant="outline" className={cfg.className}>
      {status === 'published' && <Globe className="h-3 w-3 mr-1" />}
      {status === 'unpublished' && <GlobeLock className="h-3 w-3 mr-1" />}
      {cfg.label}
    </Badge>
  )
}

// ===== Dropzone Component =====
function UploadDropzone({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void
  isUploading: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf'

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.'
    }
    if (file.size > MAX_SIZE) {
      return 'File is too large. Maximum size is 10MB.'
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        setDragError(error)
        setTimeout(() => setDragError(null), 4000)
        return
      }
      setDragError(null)
      onUpload(file)
    },
    [validateFile, onUpload]
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
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-0">
        <div
          className={`relative flex flex-col items-center justify-center py-16 px-6 rounded-lg transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'bg-[#e94560]/5 border-[#e94560]/30'
              : 'hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
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

          {isUploading ? (
            <>
              <div className="h-16 w-16 rounded-full bg-[#e94560]/10 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-[#e94560] animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700">Uploading your menu...</p>
              <p className="text-xs text-muted-foreground mt-1">Please wait while we process your file</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CloudUpload className={`h-8 w-8 transition-colors ${isDragging ? 'text-[#e94560]' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Your Menu</h3>
              <p className="text-sm text-muted-foreground mt-1.5 text-center">
                Drag and drop or click to upload
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
            </>
          )}

          {dragError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <X className="h-4 w-4 shrink-0" />
              {dragError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main UploadMenuPage Component =====
export function UploadMenuPage() {
  const { currentBusiness } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const bizId = currentBusiness?.id

  // Data State
  const [upload, setUpload] = useState<MenuUpload | null>(null)
  const [loading, setLoading] = useState(true)

  // Action States
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  // Fetch existing upload on mount
  useEffect(() => {
    if (!bizId) return
    let cancelled = false
    setLoading(true)
    menuUploadApi
      .get(bizId)
      .then((data) => {
        if (cancelled) return
        const uploads = data.uploads || []
        const latest = Array.isArray(uploads) ? uploads[0] : (data.id ? data : null)
        if (latest && latest.id) {
          setUpload({
            id: latest.id,
            fileUrl: latest.fileUrl,
            fileType: latest.fileType,
            fileName: latest.fileName || '',
            fileSize: latest.fileSize || 0,
            status: latest.status || 'draft',
            createdAt: latest.createdAt,
          })
        }
      })
      .catch(() => {
        // 404 or error means no upload exists, that's fine
        if (!cancelled) setUpload(null)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [bizId])

  // ===== Upload Handler =====
  const handleUpload = async (file: File) => {
    if (!bizId) return
    setUploading(true)
    try {
      const data = await menuUploadApi.upload(bizId, file)
      setUpload({
        id: data.id || data.upload?.id || crypto.randomUUID(),
        fileUrl: data.fileUrl || data.upload?.fileUrl || '',
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        status: data.status || 'draft',
        createdAt: data.createdAt || new Date().toISOString(),
      })
      toast.success('Menu uploaded successfully')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to upload menu')
    } finally {
      setUploading(false)
    }
  }

  // ===== Delete Handler =====
  const handleDelete = async () => {
    if (!bizId) return
    setDeleting(true)
    try {
      await menuUploadApi.delete(bizId)
      setUpload(null)
      setDeleteDialogOpen(false)
      toast.success('Menu deleted successfully')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete menu')
    } finally {
      setDeleting(false)
    }
  }

  // ===== Publish/Unpublish Handler =====
  const handlePublish = async (newStatus: string) => {
    if (!bizId || !upload) return
    setPublishing(true)
    try {
      const data = await menuUploadApi.publish(bizId, upload.id, newStatus)
      setUpload((prev) => (prev ? { ...prev, status: newStatus as MenuUpload['status'] } : null))
      if (newStatus === 'published') {
        toast.success('Menu published! Customers can now view your menu.', {
          duration: 5000,
          action: {
            label: 'View QR Code',
            onClick: () => setCurrentPage('qr-code'),
          },
        })
      } else {
        toast.success('Menu unpublished')
      }
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update publish status')
    } finally {
      setPublishing(false)
    }
  }

  // ===== File size formatter =====
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ===== Check if file is PDF =====
  const isPdf = upload?.fileType === 'application/pdf' || upload?.fileName?.endsWith('.pdf')

  // ===== Loading State =====
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upload Menu</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload an existing menu as an image or PDF for quick setup
        </p>
      </div>

      <Separator />

      {/* Content */}
      {!upload ? (
        <>
          {/* No upload - show dropzone */}
          <UploadDropzone onUpload={handleUpload} isUploading={uploading} />

          {/* Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Image Menus</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload photos of your printed menu in JPG, PNG, or WEBP format.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <FileText className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">PDF Menus</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload your menu as a PDF document for a clean presentation.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Globe className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Publish & Share</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Publish your menu and share it via QR code with customers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Upload exists - show preview and actions */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Preview Area */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isPdf ? (
                      <FileText className="h-4.5 w-4.5 text-amber-600" />
                    ) : (
                      <ImageIcon className="h-4.5 w-4.5 text-emerald-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {upload.fileName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(upload.fileSize)})
                    </span>
                  </div>
                  <StatusBadge status={upload.status} />
                </div>

                {/* Preview Container */}
                <div className="relative w-full bg-gray-50 rounded-lg border overflow-hidden">
                  {isPdf ? (
                    <iframe
                      src={upload.fileUrl}
                      className="w-full h-[500px] md:h-[600px]"
                      title="Menu PDF Preview"
                    />
                  ) : (
                    <img
                      src={upload.fileUrl}
                      alt="Menu Preview"
                      className="w-full max-h-[600px] object-contain"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Sidebar */}
            <div className="space-y-4">
              {/* Status Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Menu Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Status</span>
                    <StatusBadge status={upload.status} />
                  </div>
                  {upload.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Uploaded</span>
                      <span className="text-sm text-gray-700">
                        {new Date(upload.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Actions</h4>

                  {/* Publish / Unpublish */}
                  {upload.status === 'published' ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => handlePublish('unpublished')}
                      disabled={publishing}
                    >
                      {publishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GlobeLock className="h-4 w-4" />
                      )}
                      Unpublish Menu
                    </Button>
                  ) : (
                    <Button
                      className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handlePublish('published')}
                      disabled={publishing}
                    >
                      {publishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      Publish Menu
                    </Button>
                  )}

                  {/* Preview Fullscreen */}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setPreviewDialogOpen(true)}
                  >
                    <Eye className="h-4 w-4" />
                    Preview Menu
                  </Button>

                  {/* Replace */}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.jpg,.jpeg,.png,.webp,.pdf'
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) await handleUpload(file)
                      }
                      input.click()
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Replace Menu
                  </Button>

                  <Separator />

                  {/* Delete */}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Menu
                  </Button>
                </CardContent>
              </Card>

              {/* Published Success Hint */}
              {upload.status === 'published' && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Menu is Live</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Your menu is visible to customers via QR code.
                        </p>
                        <button
                          onClick={() => setCurrentPage('qr-code')}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 mt-2 transition-colors"
                        >
                          Go to QR Code
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== Delete Confirmation Dialog ===== */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this uploaded menu? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Full-Screen Preview Dialog ===== */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-5xl w-[calc(100%-2rem)] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-0 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Menu Preview</DialogTitle>
                <DialogDescription className="mt-1">
                  {upload?.fileName} • {upload && formatFileSize(upload.fileSize)}
                </DialogDescription>
              </div>
              {upload?.fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(upload.fileUrl, '_blank')
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Upload className="h-3 w-3" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4 pt-2">
            {upload && (
              isPdf ? (
                <iframe
                  src={upload.fileUrl}
                  className="w-full h-full rounded-lg border"
                  title="Menu PDF Full Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border overflow-auto">
                  <img
                    src={upload.fileUrl}
                    alt="Menu Full Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}