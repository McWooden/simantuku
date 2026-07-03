'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendPushNotification(targetEmployeeId, message) {
  const appId = "453e6b01-0e27-487c-8d3e-06bbda224c7f";
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!apiKey) {
    console.warn("ONESIGNAL_REST_API_KEY is not set. Bypassing push notification.");
    return;
  }

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        contents: { en: message },
        include_aliases: {
          external_id: [targetEmployeeId]
        },
        target_channel: "push"
      })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("OneSignal notification failed:", data);
    }
  } catch (err) {
    console.error("Failed to send OneSignal notification:", err);
  }
}

export async function submitLeaveAction(payload) {
  const { category, dates, note, address, recipientType, atasanId, pejabatId, attachmentUrl, onBehalfEmployeeId, status: clientStatus, requestDate } = payload;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('id, role, name').eq('auth_id', user.id).single()
  if (!employee) return { error: "No employee mapped" }

  const isAdmin = employee.role === 'admin' || employee.role === 'manager';
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

  let n_reduced = 0;
  let n1_reduced = 0;
  let n2_reduced = 0;

  if (category === 'Tahunan') {
    // Cross-year validation (enforces same calendar year)
    const years = new Set(dates.map(d => new Date(d).getFullYear()))
    if (years.size > 1) {
      return { error: "Semua tanggal cuti harus berada dalam tahun kalender yang sama." }
    }
    const currentYear = new Date(dates[0]).getFullYear()

    // Get current secure balances from the database chain
    const { data: parentRequest } = await supabase
      .from('cuti')
      .select('n_balance, n1_balance, n2_balance')
      .eq('employee_id', targetEmployeeId)
      .eq('status', 'acc')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    let availableN, availableN1, availableN2;
    if (parentRequest) {
      availableN = parentRequest.n_balance;
      availableN1 = parentRequest.n1_balance;
      availableN2 = parentRequest.n2_balance;
    } else {
      const { data: targetEmp } = await supabase
        .from('employees')
        .select('start_date')
        .eq('id', targetEmployeeId)
        .single()
      const startYear = targetEmp?.start_date ? new Date(targetEmp.start_date).getFullYear() : currentYear
      const carryover_n1 = (currentYear - 1 >= startYear) ? 6 : 0
      const carryover_n2 = (currentYear - 2 >= startYear) ? 6 : 0
      availableN = 12;
      availableN1 = carryover_n1;
      availableN2 = carryover_n2;
    }

    // Allow client to supply exact manual allocations, otherwise fallback to FIFO
    if (payload.n_reduced !== undefined && payload.n1_reduced !== undefined && payload.n2_reduced !== undefined) {
      const clientN = parseInt(payload.n_reduced, 10);
      const clientN1 = parseInt(payload.n1_reduced, 10);
      const clientN2 = parseInt(payload.n2_reduced, 10);

      if (isNaN(clientN) || clientN < 0 || clientN > availableN) {
        return { error: "Alokasi kuota tahun ini (N) tidak valid atau melebihi sisa kuota." }
      }
      if (isNaN(clientN1) || clientN1 < 0 || clientN1 > availableN1) {
        return { error: "Alokasi kuota tahun lalu (N-1) tidak valid atau melebihi sisa kuota." }
      }
      if (isNaN(clientN2) || clientN2 < 0 || clientN2 > availableN2) {
        return { error: "Alokasi kuota 2 tahun lalu (N-2) tidak valid atau melebihi sisa kuota." }
      }
      if (clientN + clientN1 + clientN2 !== daysRequested) {
        return { error: "Jumlah alokasi potongan kuota tidak sesuai dengan total hari cuti yang diajukan." }
      }

      n_reduced = clientN;
      n1_reduced = clientN1;
      n2_reduced = clientN2;
    } else {
      // Fallback to automatic FIFO allocation based on checkbox indicators
      const { includeN = true, includeN1 = true, includeN2 = true } = payload;
      let remaining = daysRequested;

      if (includeN2) {
        n2_reduced = Math.min(remaining, availableN2);
        remaining -= n2_reduced;
      }
      if (includeN1) {
        n1_reduced = Math.min(remaining, availableN1);
        remaining -= n1_reduced;
      }
      if (includeN) {
        n_reduced = Math.min(remaining, availableN);
        remaining -= n_reduced;
      }

      if (remaining > 0) {
        return { error: "Kuota cuti aktif yang dipilih tidak mencukupi untuk jumlah hari yang diajukan." }
      }
    }
  }

  // Insert request directly into the cuti table
  const isAcc = status === 'acc';
  const { data: insertedCuti, error: cutiErr } = await supabase
    .from('cuti')
    .insert({
      employee_id: targetEmployeeId,
      category,
      dates,
      note,
      address,
      recipient_type: recipientType,
      atasan_id: atasanId || null,
      pejabat_id: pejabatId || null,
      attachment_url: attachmentUrl || null,
      status: 'pending', // Always insert as pending so the RPC can process it
      is_atasan_approved: false,
      is_pejabat_approved: false,
      request_date: requestDate || null,
      n_reduced,
      n1_reduced,
      n2_reduced
    })
    .select('id')
    .single()

  if (cutiErr) return { error: cutiErr.message }

  if (isAcc) {
    // Invoke the PostgreSQL stored procedure to handle row locking, balance calculations, and chaining
    const { error: rpcErr } = await supabase.rpc('approve_leave_request', { p_leave_id: insertedCuti.id });
    if (rpcErr) {
      // rollback manually by deleting the inserted record
      await supabase.from('cuti').delete().eq('id', insertedCuti.id)
      return { error: rpcErr.message }
    }
  } else {
    // Notify the chosen Atasan directly
    if (atasanId) {
      try {
        const { data: reqEmp } = await supabase.from('employees').select('name').eq('id', targetEmployeeId).single();
        const requesterName = reqEmp?.name || "Pegawai";
        await sendPushNotification(atasanId, `Ada permohonan cuti baru dari ${requesterName} yang memerlukan persetujuan Anda.`);
      } catch (err) {
        console.error("Failed to trigger push notification on submission:", err);
      }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/form')
  revalidatePath('/admin/requests')
  return { success: true, id: insertedCuti.id }
}

export async function updateLeaveStatusAction(requestId, newStatus) {
  const supabase = await createClient()
  
  const { data: request } = await supabase.from('cuti').select('*').eq('id', requestId).single()
  if (!request) return { error: "Request not found" }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role, name')
    .eq('auth_id', user.id)
    .single()

  if (!employee) return { error: "Employee profile not found" }

  const isManager = employee.role === 'manager'
  const isDesignated = request.atasan_id === employee.id || request.pejabat_id === employee.id

  if (!isManager && !isDesignated) {
    return { error: "Anda tidak memiliki wewenang untuk mengubah status permohonan ini." }
  }

  if (newStatus === 'acc') {
    if (!isManager) {
      return { error: "Hanya Manager yang dapat langsung menyetujui permohonan." }
    }
    // Call the Supabase RPC stored procedure to approve the leave request atomically with pessimistic locking
    const { error: rpcErr } = await supabase.rpc('approve_leave_request', { p_leave_id: requestId })
    if (rpcErr) return { error: rpcErr.message }

    // Send push notification to requester
    try {
      await sendPushNotification(request.employee_id, `Selamat! Permohonan cuti Anda telah disetujui sepenuhnya oleh Pejabat. Dokumen PDF cuti Anda sudah dapat diunduh di dashboard.`);
    } catch (err) {
      console.error("Failed to notify user on push approved:", err)
    }
  } else {
    const updates = { status: newStatus }
    if (newStatus === 'ditolak') {
      updates.is_atasan_approved = false
      updates.is_pejabat_approved = false
    }
    const { error } = await supabase.from('cuti').update(updates).eq('id', requestId)
    if (error) return { error: error.message }

    if (newStatus === 'ditolak') {
      // Send push notification to requester
      try {
        await sendPushNotification(request.employee_id, `Permohonan cuti Anda ditolak oleh ${employee.name || 'Atasan/Pejabat'}.`);
      } catch (err) {
        console.error("Failed to notify user on push rejected:", err)
      }
    }
  }

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
    .select('id, role, name')
    .eq('auth_id', user.id)
    .single()

  if (!employee) return { error: "Employee profile not found" }

  const updates = {}
  const isManager = employee.role === 'manager'

  if (roleType === 'all') {
    if (!isManager) {
      return { error: "Anda tidak memiliki wewenang untuk menandatangani semua." }
    }
    // Call the Supabase RPC stored procedure to approve the leave request atomically
    const { error: rpcErr } = await supabase.rpc('approve_leave_request', { p_leave_id: requestId })
    if (rpcErr) return { error: rpcErr.message }

    // Fully approved: notify requester employee
    try {
      await sendPushNotification(request.employee_id, `Selamat! Permohonan cuti Anda telah disetujui sepenuhnya oleh Pejabat. Dokumen PDF cuti Anda sudah dapat diunduh di dashboard.`);
    } catch (err) {
      console.error("Failed to notify user on push fully approved (all):", err)
    }
  } else {
    if (roleType === 'atasan') {
      if (request.atasan_id !== employee.id && !isManager) {
        return { error: "Anda bukan Atasan Langsung yang ditunjuk untuk permohonan ini." }
      }
      updates.is_atasan_approved = true
    } else if (roleType === 'pejabat') {
      if (request.pejabat_id !== employee.id && !isManager) {
        return { error: "Anda bukan Pejabat Berwenang yang ditunjuk untuk permohonan ini." }
      }
      updates.is_pejabat_approved = true
    } else {
      return { error: "Tipe tanda tangan tidak valid." }
    }

    const finalIsAtasanApproved = roleType === 'atasan' ? true : (request.is_atasan_approved || !request.atasan_id)
    const finalIsPejabatApproved = roleType === 'pejabat' ? true : (request.is_pejabat_approved || !request.pejabat_id)

    if (finalIsAtasanApproved && finalIsPejabatApproved) {
      // Transitioning to approved: invoke the Supabase RPC
      // First update signature fields
      const { error: signErr } = await supabase.from('cuti').update(updates).eq('id', requestId)
      if (signErr) return { error: signErr.message }

      const { error: rpcErr } = await supabase.rpc('approve_leave_request', { p_leave_id: requestId })
      if (rpcErr) return { error: rpcErr.message }

      // Fully approved: notify requester employee
      try {
        await sendPushNotification(request.employee_id, `Selamat! Permohonan cuti Anda telah disetujui sepenuhnya oleh Pejabat. Dokumen PDF cuti Anda sudah dapat diunduh di dashboard.`);
      } catch (err) {
        console.error("Failed to notify user on push fully approved (partial):", err)
      }
    } else {
      // Just update intermediate signature fields
      const { error } = await supabase.from('cuti').update(updates).eq('id', requestId)
      if (error) return { error: error.message }

      // If signed by Atasan, notify the Pejabat who needs to sign next
      if (roleType === 'atasan' && request.pejabat_id) {
        try {
          const { data: reqEmp } = await supabase.from('employees').select('name').eq('id', request.employee_id).single();
          const requesterName = reqEmp?.name || "Pegawai";
          await sendPushNotification(request.pejabat_id, `Permohonan cuti ${requesterName} telah disetujui oleh Atasan Langsung dan sekarang menunggu tanda tangan final Anda.`);
        } catch (err) {
          console.error("Failed to notify pejabat on intermediate sign:", err)
        }
      }
    }
  }

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

  let remainingN, remainingN1, remainingN2;

  // 2. Fetch snapshot balances from the chain
  if (excludeLeaveId) {
    // If excluding a request, fetch parent record's balances
    const { data: currentRequest } = await supabase
      .from('cuti')
      .select('parent_cuti_id')
      .eq('id', excludeLeaveId)
      .single()

    if (currentRequest && currentRequest.parent_cuti_id) {
      const { data: parentRequest } = await supabase
        .from('cuti')
        .select('n_balance, n1_balance, n2_balance')
        .eq('id', currentRequest.parent_cuti_id)
        .single()

      if (parentRequest) {
        remainingN = parentRequest.n_balance;
        remainingN1 = parentRequest.n1_balance;
        remainingN2 = parentRequest.n2_balance;
      }
    }
  }

  // If balances are not yet computed (no excludeId or parent not found)
  if (remainingN === undefined) {
    const { data: latestRequest } = await supabase
      .from('cuti')
      .select('n_balance, n1_balance, n2_balance')
      .eq('employee_id', employeeId)
      .eq('status', 'acc')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestRequest) {
      remainingN = latestRequest.n_balance;
      remainingN1 = latestRequest.n1_balance;
      remainingN2 = latestRequest.n2_balance;
    } else {
      // Default initial calculation if no approved request exists yet
      const carryover_n1 = (currentYear - 1 >= startYear) ? 6 : 0
      const carryover_n2 = (currentYear - 2 >= startYear) ? 6 : 0
      remainingN = 12;
      remainingN1 = carryover_n1;
      remainingN2 = carryover_n2;
    }
  }

  const carryover_n1_total = (currentYear - 1 >= startYear) ? 6 : 0
  const carryover_n2_total = (currentYear - 2 >= startYear) ? 6 : 0

  const buckets = [
    {
      year: currentYear - 2,
      total: carryover_n2_total,
      used: carryover_n2_total - remainingN2,
      remaining: remainingN2,
      expires_at: null
    },
    {
      year: currentYear - 1,
      total: carryover_n1_total,
      used: carryover_n1_total - remainingN1,
      remaining: remainingN1,
      expires_at: null
    },
    {
      year: currentYear,
      total: 12,
      used: 12 - remainingN,
      remaining: remainingN,
      expires_at: null
    }
  ]

  return {
    totalAllowed: 12,
    totalRemaining: remainingN,
    used: 12 - remainingN,
    carryoverAllowed: remainingN1 + remainingN2,
    progressPercent: Math.min(100, Math.max(0, Math.round((remainingN / 12) * 100))),
    buckets: buckets.sort((a, b) => a.year - b.year)
  }
}

export async function runOneTimeMigrationAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).single()
  if (!employee || (employee.role !== 'admin' && employee.role !== 'manager')) return { error: "Only admins can run migrations" }

  // Fetch all employees
  const { data: employees } = await supabase.from('employees').select('id, start_date')
  if (!employees) return { error: "No employees found" }

  let migratedCount = 0

  for (const emp of employees) {
    // Fetch all approved leaves for this employee, sorted deterministically
    const { data: leaves } = await supabase
      .from('cuti')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('status', 'acc')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })

    if (!leaves || leaves.length === 0) continue

    let parentId = null
    let lastN = 12
    let lastN1 = 0
    let lastN2 = 0
    let isFirst = true

    for (const leave of leaves) {
      const dates = leave.dates || []
      if (dates.length === 0) continue

      const currentYear = new Date(dates[0]).getFullYear()
      const startYear = emp.start_date ? new Date(emp.start_date).getFullYear() : currentYear

      // Calculate initial balances for the first node in the chain
      if (isFirst) {
        lastN = 12
        lastN1 = (currentYear - 1 >= startYear) ? 6 : 0
        lastN2 = (currentYear - 2 >= startYear) ? 6 : 0
        isFirst = false
      }

      let n_reduced = 0
      let n1_reduced = 0
      let n2_reduced = 0

      if (leave.category === 'Tahunan') {
        let remaining = dates.length
        
        // FIFO deduction: N-2 -> N-1 -> N
        n2_reduced = Math.min(remaining, lastN2)
        remaining -= n2_reduced

        n1_reduced = Math.min(remaining, lastN1)
        remaining -= n1_reduced

        n_reduced = Math.min(remaining, lastN)
        remaining -= n_reduced
      }

      // Calculate new balances
      const n_balance = lastN - n_reduced
      const n1_balance = lastN1 - n1_reduced
      const n2_balance = lastN2 - n2_reduced

      // Update the record
      await supabase
        .from('cuti')
        .update({
          parent_cuti_id: parentId,
          n_reduced,
          n1_reduced,
          n2_reduced,
          n_balance,
          n1_balance,
          n2_balance
        })
        .eq('id', leave.id)

      // Move downstream
      parentId = leave.id
      lastN = n_balance
      lastN1 = n1_balance
      lastN2 = n2_balance
      migratedCount++
    }
  }

  return { success: true, migratedCount }
}

export async function verifyChainIntegrityAction(employeeId) {
  const supabase = await createClient()
  // Fetch all approved leaves for this employee
  const { data: leaves } = await supabase
    .from('cuti')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'acc')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (!leaves || leaves.length === 0) return { valid: true, message: "No approved requests." }

  let parentId = null
  let expectedN = 12
  let expectedN1 = 0
  let expectedN2 = 0
  let isFirst = true

  for (let i = 0; i < leaves.length; i++) {
    const leave = leaves[i]
    if (isFirst) {
      expectedN = 12
      const firstYear = new Date(leave.dates[0]).getFullYear()
      const { data: emp } = await supabase.from('employees').select('start_date').eq('id', employeeId).single()
      const startYear = emp?.start_date ? new Date(emp.start_date).getFullYear() : firstYear
      expectedN1 = (firstYear - 1 >= startYear) ? 6 : 0
      expectedN2 = (firstYear - 2 >= startYear) ? 6 : 0
      isFirst = false
    }

    if (leave.parent_cuti_id !== parentId) {
      return { valid: false, message: `Chain broken at request ${leave.id}. Expected parent ${parentId}, got ${leave.parent_cuti_id}.` }
    }

    const calcN = expectedN - (leave.n_reduced || 0)
    const calcN1 = expectedN1 - (leave.n1_reduced || 0)
    const calcN2 = expectedN2 - (leave.n2_reduced || 0)

    if (leave.n_balance !== calcN || leave.n1_balance !== calcN1 || leave.n2_balance !== calcN2) {
      return { valid: false, message: `Balance mismatch at request ${leave.id}. Snapshot balances (N:${leave.n_balance}, N1:${leave.n1_balance}, N2:${leave.n2_balance}) do not match calculated balances (N:${calcN}, N1:${calcN1}, N2:${calcN2}).` }
    }

    parentId = leave.id
    expectedN = calcN
    expectedN1 = calcN1
    expectedN2 = calcN2
  }

  return { valid: true, message: "Chain is continuous and snapshot balances are valid." }
}

export async function deleteLeaveAction(requestId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('id, name').eq('auth_id', user.id).single()
  if (!employee) return { error: "Unauthorized" }

  const { data: request, error: fetchErr } = await supabase
    .from('cuti')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: "Request not found" }
  
  if (request.employee_id !== employee.id) return { error: "Unauthorized" }
  if (request.status !== 'pending') return { error: "Only pending requests can be deleted" }

  // Send push notification to the current pending signatory
  const targetSignatoryId = request.is_atasan_approved ? request.pejabat_id : request.atasan_id;
  if (targetSignatoryId) {
    try {
      await sendPushNotification(targetSignatoryId, `${employee.name} telah membatalkan pengajuan cuti yang sebelumnya dikirimkan.`);
    } catch (err) {
      console.error("Failed to notify signatory of canceled request:", err)
    }
  }

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
  if (!employee || (employee.role !== 'admin' && employee.role !== 'manager')) return { error: "Unauthorized. Admin/Manager only." }

  const { data: request, error: fetchErr } = await supabase
    .from('cuti')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: "Request not found" }

  if (request.status !== 'acc' && request.status !== 'ditolak') {
    return { error: "Only approved (acc) or rejected requests can be deleted by admin." }
  }
  
  const { error } = await supabase.from('cuti').delete().eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  revalidatePath('/admin/attachments')
  return { success: true }
}

export async function bulkDeleteRejectedRequestsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).single()
  if (!employee || (employee.role !== 'admin' && employee.role !== 'manager')) return { error: "Unauthorized. Admin/Manager only." }

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
  revalidatePath('/admin/attachments')
  return { success: true, count: rejectedRequests.length }
}

export async function deleteStorageFileAction(fullPath) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).single()
  if (!employee || (employee.role !== 'admin' && employee.role !== 'manager')) return { error: "Unauthorized. Admin/Manager only." }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabaseAdmin.storage
    .from('leave_attachments')
    .remove([fullPath])

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "File not found or could not be deleted from storage." }

  return { success: true }
}

export async function deleteMultipleStorageFilesAction(paths) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('role').eq('auth_id', user.id).single()
  if (!employee || (employee.role !== 'admin' && employee.role !== 'manager')) return { error: "Unauthorized. Admin/Manager only." }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabaseAdmin.storage
    .from('leave_attachments')
    .remove(paths)

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "No files were deleted from storage." }

  return { success: true, deletedCount: data.length }
}

export async function getRequestsSummaryAction({ tab, searchQuery, currentEmployeeId }) {
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('cuti')
    .select(`
      id,
      created_at,
      dates,
      category,
      atasan_id,
      pejabat_id,
      status,
      is_atasan_approved,
      is_pejabat_approved,
      employee:employees!employee_id (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching summary:", error)
    return { groups: [], pendingMentionedCount: 0, pendingOthersActionCount: 0, totalCount: 0, mentionedCount: 0 }
  }

  // Filter by search query if present
  let filtered = requests
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = requests.filter(r => {
      const name = (r.employee?.name || '').toLowerCase()
      const category = (r.category || '').toLowerCase()
      return name.includes(q) || category.includes(q)
    })
  }

  // Calculate counts for mentioned requests
  const mentionedRequests = filtered.filter(r => r.atasan_id === currentEmployeeId || r.pejabat_id === currentEmployeeId)
  const mentionedCount = mentionedRequests.length
  const totalCount = filtered.length

  const pendingMentionedCount = mentionedRequests.filter(r => {
    if (r.status !== 'pending') return false
    const isAtasan = r.atasan_id === currentEmployeeId
    const isPejabat = r.pejabat_id === currentEmployeeId
    const needAtasanSign = isAtasan && !r.is_atasan_approved
    const needPejabatSign = isPejabat && !r.is_pejabat_approved
    return needAtasanSign || needPejabatSign
  }).length

  const pendingOthersActionCount = mentionedRequests.filter(r => {
    if (r.status !== 'pending') return false
    const isAtasan = r.atasan_id === currentEmployeeId
    const isPejabat = r.pejabat_id === currentEmployeeId
    const isSignedAtasan = isAtasan && r.is_atasan_approved
    const isSignedPejabat = isPejabat && r.is_pejabat_approved
    return isSignedAtasan || isSignedPejabat
  }).length

  // Filter by tab for grouping
  const tabFiltered = tab === 'mentioned' ? mentionedRequests : filtered

  // Group by month and count using first day from dates
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const currentYear = new Date().getFullYear()

  const groups = {}
  tabFiltered.forEach(r => {
    const firstDateStr = r.dates && r.dates.length > 0 ? r.dates[0] : r.created_at
    const date = new Date(firstDateStr)
    const month = date.getMonth()
    const year = date.getFullYear()
    
    const groupKey = year === currentYear 
      ? monthNames[month] 
      : `${monthNames[month]} ${year}`

    const monthId = `${year}-${String(month + 1).padStart(2, '0')}` // e.g. "2026-07"

    if (!groups[monthId]) {
      groups[monthId] = {
        id: monthId,
        label: groupKey,
        ids: [],
        count: 0,
        year,
        month
      }
    }
    groups[monthId].ids.push(r.id)
    groups[monthId].count++
  })

  return {
    groups: Object.values(groups).sort((a, b) => b.id.localeCompare(a.id)),
    pendingMentionedCount,
    pendingOthersActionCount,
    totalCount,
    mentionedCount
  }
}

export async function getRequestsForMonthAction({ requestIds }) {
  if (!requestIds || requestIds.length === 0) return []
  
  const supabase = await createClient()

  const { data: requests, error } = await supabase
    .from('cuti')
    .select(`
      *,
      employee:employees!employee_id (
        name
      )
    `)
    .in('id', requestIds)

  if (error) {
    console.error("Error fetching requests for month:", error)
    return []
  }

  // Sort requests by the first date in dates array descending (newest first)
  const sorted = requests.sort((a, b) => {
    const dateA = new Date(a.dates && a.dates.length > 0 ? a.dates[0] : a.created_at)
    const dateB = new Date(b.dates && b.dates.length > 0 ? b.dates[0] : b.created_at)
    return dateB - dateA
  })

  return sorted
}


