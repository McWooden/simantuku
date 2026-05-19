'use client'

import { useState, useEffect } from 'react'
import { generateLeavePDF } from '@/lib/pdfGenerator'
import { getLeaveQuotaOverviewAction } from '@/app/actions/leaveActions'
import { Loader2, AlertCircle } from 'lucide-react'

export function PdfPreviewEmbed({ request }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadPdf() {
      try {
        setLoading(true)
        
        let quotas = { sisaN: 0, sisaN1: 0, sisaN2: 0 }
        
        if (request.category === 'Tahunan') {
          const quotaData = await getLeaveQuotaOverviewAction(request.employee_id)
          const currentYear = new Date().getFullYear()

          // Add back the deducted days for this specific request to show the quota AT THE TIME of request
          if (request.breakdowns && request.breakdowns.length > 0) {
            request.breakdowns.forEach(bd => {
              const bucket = quotaData.buckets?.find(b => b.year === bd.quota_year)
              if (bucket) {
                bucket.remaining += bd.days_deducted
              }
            })
          }

          quotas = {
             sisaN: quotaData.buckets?.find(b => b.year === currentYear)?.remaining || 0,
             sisaN1: quotaData.buckets?.find(b => b.year === currentYear - 1)?.remaining || 0,
             sisaN2: quotaData.buckets?.find(b => b.year === currentYear - 2)?.remaining || 0
          }
        }

        const pdfData = {
          employeeId: request.employee_id,
          status: request.status,
          name: request.employee.name,
          nip: request.employee.nip,
          position: request.employee.position,
          unit: request.employee.unit,
          phone: request.employee.phone_number,
          employeeStartDate: request.employee.start_date,
          category: request.category,
          dates: request.dates,
          note: request.note,
          address: request.address,
          recipientType: request.recipient_type,
          atasan: request.atasan,
          pejabat: request.pejabat,
          quotas
        }

        const blob = await generateLeavePDF(pdfData)
        if (active) {
          setPdfUrl(URL.createObjectURL(blob))
        }
      } catch (err) {
        console.error(err)
        if (active) setError('Gagal memuat pratinjau surat cuti.')
      } finally {
        if (active) setLoading(false)
      }
    }
    
    loadPdf()
    
    return () => {
      active = false
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [request])

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Membuat pratinjau surat cuti...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[600px] bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center text-red-500">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p className="font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[800px] border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full border-0" title="PDF Preview" />
    </div>
  )
}
