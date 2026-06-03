'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitLeaveAction(payload) {
  const { category, dates, note, address, recipientType, atasanId, pejabatId, attachmentUrl, onBehalfEmployeeId, status: clientStatus } = payload;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('id, role').eq('auth_id', user.id).single()
  if (!employee) return { error: "No employee mapped" }

  const isAdmin = employee.role === 'admin';
  let targetEmployeeId = employee.id;
  let status = 'pending';

  if (isAdmin) {
    status = clientStatus || 'acc';
    if (onBehalfEmployeeId) {
      targetEmployeeId = onBehalfEmployeeId;
    }
  }

  // Enforce "One Pending Request" rule only for pending statuses
  if (status === 'pending') {
    const { count: pendingCount } = await supabase
      .from('cuti')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', targetEmployeeId)
      .eq('status', 'pending')

    if (pendingCount > 0) {
      return { error: "You already have a pending leave request. Please wait for it to be processed or delete it before submitting another." }
    }
  }

  const daysRequested = dates.length;
  if (daysRequested === 0) return { error: "No dates selected" }

  if (category === 'Tahunan') {
    // 2. Cross-year validation (enforces same calendar year)
    const years = new Set(dates.map(d => new Date(d).getFullYear()))
    if (years.size > 1) {
      return { error: "Semua tanggal cuti harus berada dalam tahun kalender yang sama." }
    }
  }

  // Insert request directly into the cuti table
  const isAcc = status === 'acc';
  const { error: cutiErr } = await supabase.from('cuti').insert({
    employee_id: targetEmployeeId,
    category,
    dates,
    note,
    address,
    recipient_type: recipientType,
    atasan_id: atasanId || null,
    pejabat_id: pejabatId || null,
    attachment_url: attachmentUrl || null,
    status: status,
    is_atasan_approved: isAcc,
    is_pejabat_approved: isAcc
  })

  if (cutiErr) return { error: cutiErr.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/form')
  revalidatePath('/admin/requests')
  return { success: true }
}

export async function updateLeaveStatusAction(requestId, newStatus) {
  const supabase = await createClient()
  
  const { data: request } = await supabase.from('cuti').select('*').eq('id', requestId).single()
  if (!request) return { error: "Request not found" }

  const updates = { status: newStatus }
  if (newStatus === 'ditolak') {
    updates.is_atasan_approved = false
    updates.is_pejabat_approved = false
  } else if (newStatus === 'acc') {
    updates.is_atasan_approved = true
    updates.is_pejabat_approved = true
  }

  const { error } = await supabase.from('cuti').update(updates).eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function signLeaveAction(requestId, roleType) {
  const supabase = await createClient()

  // 1. Get request
  const { data: request } = await supabase.from('cuti').select('*').eq('id', requestId).single()
  if (!request) return { error: "Request not found" }

  // 2. Get currently logged in employee to verify role authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (!employee) return { error: "Employee profile not found" }

  const updates = {}
  if (roleType === 'atasan') {
    if (request.atasan_id !== employee.id && employee.role !== 'admin') {
      return { error: "Anda bukan Atasan Langsung yang ditunjuk untuk permohonan ini." }
    }
    updates.is_atasan_approved = true
  } else if (roleType === 'pejabat') {
    if (request.pejabat_id !== employee.id && employee.role !== 'admin') {
      return { error: "Anda bukan Pejabat Berwenang yang ditunjuk untuk permohonan ini." }
    }
    updates.is_pejabat_approved = true
  } else {
    return { error: "Tipe tanda tangan tidak valid." }
  }

  // Determine if the leave is now fully approved (both are signed or null)
  const finalIsAtasanApproved = roleType === 'atasan' ? true : (request.is_atasan_approved || !request.atasan_id)
  const finalIsPejabatApproved = roleType === 'pejabat' ? true : (request.is_pejabat_approved || !request.pejabat_id)

  if (finalIsAtasanApproved && finalIsPejabatApproved) {
    updates.status = 'acc'
  }

  const { error } = await supabase.from('cuti').update(updates).eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getLeaveQuotaOverviewAction(employeeId, excludeLeaveId = null) {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  // 1. Fetch employee start date to restrict carryover
  const { data: employee } = await supabase
    .from('employees')
    .select('start_date')
    .eq('id', employeeId)
    .single()

  const startYear = employee?.start_date ? new Date(employee.start_date).getFullYear() : currentYear

  // 2. Single clean query to fetch all approved 'Tahunan' leaves
  const { data: approvedLeaves } = await supabase
    .from('cuti')
    .select('id, dates')
    .eq('employee_id', employeeId)
    .eq('category', 'Tahunan')
    .eq('status', 'acc')

  // Group and sum used days by year for the last 3 years
  const usedByYear = { [currentYear]: 0, [currentYear - 1]: 0, [currentYear - 2]: 0 }

  if (approvedLeaves) {
    for (const leave of approvedLeaves) {
      if (leave.id === excludeLeaveId) continue
      if (leave.dates) {
        for (const dateStr of leave.dates) {
          const year = new Date(dateStr).getFullYear()
          if (year in usedByYear) {
            usedByYear[year]++
          } else {
            usedByYear[year] = (usedByYear[year] || 0) + 1
          }
        }
      }
    }
  }

  const used_n = usedByYear[currentYear] || 0
  const used_n1 = usedByYear[currentYear - 1] || 0
  const used_n2 = usedByYear[currentYear - 2] || 0

  // Calculate carryovers on-the-fly based on remaining quota of past years (max 6 each)
  const carryover_n1 = (currentYear - 1 >= startYear) ? Math.max(0, Math.min(12 - used_n1, 6)) : 0
  const carryover_n2 = (currentYear - 2 >= startYear) ? Math.max(0, Math.min(12 - used_n2, 6)) : 0
  const total_kuota = 12 + carryover_n1 + carryover_n2
  const sisa_kuota = total_kuota - used_n

  const buckets = [
    {
      year: currentYear - 2,
      total: (currentYear - 2 >= startYear) ? 6 : 0,
      used: (currentYear - 2 >= startYear) ? 6 - carryover_n2 : 0,
      remaining: carryover_n2,
      expires_at: null
    },
    {
      year: currentYear - 1,
      total: (currentYear - 1 >= startYear) ? 6 : 0,
      used: (currentYear - 1 >= startYear) ? 6 - carryover_n1 : 0,
      remaining: carryover_n1,
      expires_at: null
    },
    {
      year: currentYear,
      total: 12,
      used: used_n,
      remaining: 12 - used_n,
      expires_at: null
    }
  ]

  return {
    totalAllowed: 12,
    totalRemaining: 12 - used_n,
    used: used_n,
    carryoverAllowed: carryover_n1 + carryover_n2,
    progressPercent: Math.min(100, Math.max(0, Math.round(((12 - used_n) / 12) * 100))),
    buckets: buckets.sort((a, b) => a.year - b.year)
  }
}

export async function deleteLeaveAction(requestId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('id').eq('auth_id', user.id).single()
  if (!employee) return { error: "Unauthorized" }

  const { data: request, error: fetchErr } = await supabase
    .from('cuti')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: "Request not found" }
  
  if (request.employee_id !== employee.id) return { error: "Unauthorized" }
  if (request.status !== 'pending') return { error: "Only pending requests can be deleted" }

  const { error } = await supabase.from('cuti').delete().eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/requests')
  return { success: true }
}

export async function adminDeleteLeaveAction(requestId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).single()
  if (!employee || employee.role !== 'admin') return { error: "Unauthorized. Admin only." }

  const { data: request, error: fetchErr } = await supabase
    .from('cuti')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: "Request not found" }
  
  const { error } = await supabase.from('cuti').delete().eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  revalidatePath('/admin/manage/attachments')
  return { success: true }
}

export async function bulkDeleteRejectedRequestsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).single()
  if (!employee || employee.role !== 'admin') return { error: "Unauthorized. Admin only." }

  const { data: rejectedRequests, error: fetchErr } = await supabase
    .from('cuti')
    .select('id, attachment_url')
    .eq('status', 'ditolak')

  if (fetchErr) return { error: fetchErr.message }
  if (!rejectedRequests || rejectedRequests.length === 0) {
    return { success: true, message: "Tidak ada permintaan yang ditolak untuk dihapus." }
  }

  const attachmentsToDelete = rejectedRequests
    .map(r => r.attachment_url)
    .filter(url => url !== null && url !== '')

  if (attachmentsToDelete.length > 0) {
    const { error: storageErr } = await supabase.storage
      .from('leave_attachments')
      .remove(attachmentsToDelete)
    
    if (storageErr) {
      console.error("Error deleting bulk attachments:", storageErr)
    }
  }

  const { error: deleteErr } = await supabase
    .from('cuti')
    .delete()
    .eq('status', 'ditolak')

  if (deleteErr) return { error: deleteErr.message }

  revalidatePath('/admin/requests')
  revalidatePath('/admin/manage/attachments')
  return { success: true, count: rejectedRequests.length }
}
