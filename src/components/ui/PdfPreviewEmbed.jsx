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
        
        const quotaData = await getLeaveQuotaOverviewAction(request.employee_id, request.id)
        const currentYear = new Date().getFullYear()

        const quotas = {
           sisaN: quotaData.buckets?.find(b => b.year === currentYear)?.remaining || 0,
           sisaN1: quotaData.buckets?.find(b => b.year === currentYear - 1)?.remaining || 0,
           sisaN2: quotaData.buckets?.find(b => b.year === currentYear - 2)?.remaining || 0
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
          isAtasanApproved: request.is_atasan_approved,
          isPejabatApproved: request.is_pejabat_approved,
          requestDate: request.request_date,
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
