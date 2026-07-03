import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/app/actions/leaveActions'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const supabase = await createClient()

  // 1. Fetch pending requests with requester employee details
  const { data: pendingRequests, error } = await supabase
    .from('cuti')
    .select(`
      *,
      employee:employees!employee_id(name),
      atasan:employees!atasan_id(name),
      pejabat:employees!pejabat_id(name)
    `)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = new Date()
  let remindersSent = 0

  if (pendingRequests) {
    for (const req of pendingRequests) {
      const createdAt = new Date(req.created_at)
      const diffMs = now - createdAt
      const diffHours = diffMs / (1000 * 60 * 60)

      const requesterName = req.employee?.name || "Pegawai"
      
      // Determine the current active signatory requiring signing action
      const targetSignatoryId = req.is_atasan_approved ? req.pejabat_id : req.atasan_id
      const targetSignatoryName = req.is_atasan_approved 
        ? (req.pejabat?.name || "Pejabat")
        : (req.atasan?.name || "Atasan")

      if (!targetSignatoryId) continue

      // Categorize action triggers based on request age (checked every hour)
      if (diffHours >= 3 && diffHours < 4) {
        // Send 3-hour alert to signatory
        await sendPushNotification(
          targetSignatoryId,
          `Pengingat (3 Jam): Permohonan cuti dari ${requesterName} masih menunggu tanda tangan Anda.`
        )
        remindersSent++
      }
      else if (diffHours >= 10 && diffHours < 11) {
        // Send 10-hour alert to signatory
        await sendPushNotification(
          targetSignatoryId,
          `Pengingat (10 Jam): Permohonan cuti dari ${requesterName} masih menunggu tanda tangan Anda.`
        )
        remindersSent++
      }
      else if (diffHours >= 24 && diffHours < 25) {
        // Send 24-hour follow up trigger to employee
        await sendPushNotification(
          req.employee_id,
          `Pengajuan cuti Anda belum direspon oleh ${targetSignatoryName} selama 24 jam. Silakan hubungi atasan Anda secara langsung.`
        )
        remindersSent++
      }
    }
  }

  return NextResponse.json({ success: true, remindersSent })
}
