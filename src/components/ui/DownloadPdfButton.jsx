'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Eye } from 'lucide-react'
import { generateLeavePDF, downloadBlob } from '@/lib/pdfGenerator'

export function DownloadPdfButton({ employeeName, leave, customCoords, variant = "outline", size = "sm", className = "gap-2" }) {
  const [loading, setLoading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const blob = await generateLeavePDF({
        name: employeeName,
        category: leave.category,
        dates: leave.dates,
        note: leave.note,
        customCoords
      })
      downloadBlob(blob, `${leave.category}_Cuti.pdf`)
    } catch (e) {
      console.error(e)
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    try {
      setLoadingPreview(true)
      const blob = await generateLeavePDF({
        name: employeeName,
        category: leave.category,
        dates: leave.dates,
        note: leave.note,
        customCoords
      })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (e) {
      console.error(e)
      alert(e.message)
    } finally {
      setLoadingPreview(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={variant} size={size} onClick={handlePreview} disabled={loading || loadingPreview} className={className} type="button">
        {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
        <span className="hidden md:inline">Preview</span>
      </Button>
      <Button variant={variant} size={size} onClick={handleDownload} disabled={loading || loadingPreview} className={className} type="button">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="hidden md:inline">Download</span>
      </Button>
    </div>
  )
}
