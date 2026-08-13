'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/stores'
import { qrApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Download,
  FileCode,
  Link2,
  Share2,
  Printer,
  QrCode,
  ShieldCheck,
  PictureInWindow2,
  Smartphone,
  Info,
} from 'lucide-react'

interface QrData {
  slug: string
  pngUrl: string
  svgUrl: string | null
}

const infoCards = [
  {
    icon: ShieldCheck,
    title: 'Permanent QR Code',
    description: 'Your QR code stays the same even when you update your menu',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Printer,
    title: 'Print & Place Anywhere',
    description: 'Print this QR code and place it on tables, counters, or windows',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    icon: Smartphone,
    title: 'Instant Digital Access',
    description: 'Customers scan to see your full digital menu',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
]

export function QrCodePage() {
  const { currentBusiness } = useAuthStore()
  const [qrData, setQrData] = useState<QrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printFrameRef = useRef<HTMLIFrameElement | null>(null)

  const businessId = currentBusiness?.id
  const menuUrl = qrData ? `${window.location.origin}/menu/${qrData.slug}` : ''

  const fetchQrCode = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await qrApi.get(businessId)
      setQrData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchQrCode()
  }, [fetchQrCode])

  const handleDownloadPng = () => {
    if (!qrData?.pngUrl) return
    const a = document.createElement('a')
    a.href = qrData.pngUrl
    a.download = `${currentBusiness?.slug || 'menu'}-qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('PNG downloaded successfully')
  }

  const handleDownloadSvg = () => {
    if (!qrData?.svgUrl) return
    const a = document.createElement('a')
    a.href = qrData.svgUrl
    a.download = `${currentBusiness?.slug || 'menu'}-qr.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('SVG downloaded successfully')
  }

  const handleCopyLink = async () => {
    if (!menuUrl) return
    try {
      await navigator.clipboard.writeText(menuUrl)
      toast.success('Menu link copied to clipboard')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (!menuUrl) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${currentBusiness?.name || 'Menu'} - Digital Menu`,
          text: 'Scan this QR code to view our digital menu!',
          url: menuUrl,
        })
      } catch (err) {
        // User cancelled or share failed — fallback to copy
        if ((err as DOMException).name !== 'AbortError') {
          await handleCopyLink()
        }
      }
    } else {
      await handleCopyLink()
    }
  }

  const handlePrint = () => {
    if (!qrData?.pngUrl) return

    // Remove any previous print iframe
    const existingFrame = document.getElementById('qr-print-frame')
    if (existingFrame) existingFrame.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'qr-print-frame'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    printFrameRef.current = iframe

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code - ${currentBusiness?.name || 'Menu'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .qr-container {
            text-align: center;
            padding: 40px 20px;
          }
          .qr-container img {
            width: 300px;
            height: 300px;
          }
          .business-name {
            font-size: 20px;
            font-weight: 700;
            margin-top: 16px;
            color: #111;
          }
          .scan-text {
            font-size: 13px;
            color: #666;
            margin-top: 6px;
          }
          @media print {
            body { min-height: auto; }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <img src="${qrData.pngUrl}" alt="QR Code" />
          <div class="business-name">${currentBusiness?.name || 'Digital Menu'}</div>
          <div class="scan-text">Scan to view our digital menu</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.parent.document.getElementById('qr-print-frame').remove();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `)
    iframeDoc.close()
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">QR Code</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage your menu QR code
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="space-y-4 w-full max-w-sm">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-[280px] w-[280px] rounded-2xl mx-auto" />
            <Skeleton className="h-10 w-full max-w-xs mx-auto" />
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !qrData) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">QR Code</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage your menu QR code
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
              <QrCode className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Failed to generate QR code</h3>
            <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-sm">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <Button
              onClick={fetchQrCode}
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
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">QR Code</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and manage your menu QR code
        </p>
      </div>

      {/* QR Code Display */}
      <Card>
        <CardContent className="flex flex-col items-center py-8 md:py-12 px-4">
          <div className="relative">
            <div className="w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-white">
              <img
                src={qrData.pngUrl}
                alt="Menu QR Code"
                className="w-[256px] h-[256px] md:w-[296px] md:h-[296px] object-contain"
              />
            </div>
          </div>

          {/* Menu URL */}
          <div className="mt-6 w-full max-w-md">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Menu URL
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={menuUrl}
                className="font-mono text-sm bg-gray-50 select-all"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
                title="Copy link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-lg">
            <Button
              onClick={handleDownloadPng}
              variant="outline"
              className="gap-2 h-10"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">PNG</span>
              <span className="hidden sm:inline">PNG</span>
            </Button>
            <Button
              onClick={handleDownloadSvg}
              variant="outline"
              className="gap-2 h-10"
              disabled={!qrData.svgUrl}
            >
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">SVG</span>
              <span className="hidden sm:inline">SVG</span>
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="gap-2 h-10"
            >
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Copy</span> Link
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="gap-2 h-10"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            variant="outline"
            className="mt-4 gap-2 text-gray-600"
          >
            <Printer className="h-4 w-4" />
            Print QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {infoCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-gray-100">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${card.bgColor} shrink-0`}>
                    <Icon className={`h-4.5 w-4.5 ${card.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{card.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
