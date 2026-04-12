'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Ensures necessary buckets exist and lazy-caps older buckets
async function ensureAndCapQuotas(supabase, employeeId, currentYear) {
  // 1. Get employee start date to know how far back we can grant quotas
  const { data: employee } = await supabase
    .from('employees')
    .select('start_date')
    .eq('id', employeeId)
    .single()
  
  const startYear = employee?.start_date ? new Date(employee.start_date).getFullYear() : currentYear

  // 2. Fetch existing buckets
  const { data: allBuckets } = await supabase
    .from('leave_quota')
    .select('*')
    .eq('employee_id', employeeId)
  
  const existingYears = allBuckets?.map(b => b.year) || []

  // 3. Ensure buckets exist for the last 3 years (if employed)
  const yearsToEnsure = [currentYear, currentYear - 1, currentYear - 2].filter(y => y >= startYear)
  
  for (const year of yearsToEnsure) {
    if (!existingYears.includes(year)) {
      const isCurrent = year === currentYear;
      const expiresAt = new Date(Date.UTC(year + 2, 11, 31, 23, 59, 59)).toISOString()
      
      await supabase.from('leave_quota').insert({
        employee_id: employeeId,
        year: year,
        total_days: isCurrent ? 12 : 6, // New years get 12, historical carryover markers get max 6
        used_days: 0,
        is_capped: !isCurrent, // Historical ones are already "capped" at 6
        expires_at: expiresAt
      })
    }
  }

  // 4. Lazy-evaluate carryover limits for any older buckets that weren't capped yet
  if (allBuckets) {
    for (const bucket of allBuckets) {
      if (bucket.year < currentYear && !bucket.is_capped) {
        const remaining = bucket.total_days - bucket.used_days;
        // Cap carryover directly
        const carriedOver = Math.max(0, Math.min(remaining, 6)); 
        const newTotal = bucket.used_days + carriedOver;
        
        await supabase.from('leave_quota')
          .update({ total_days: newTotal, is_capped: true })
          .eq('id', bucket.id)
      }
    }
  }

  // 5. Fetch resulting valid buckets (n-2 to n)
  const { data: finalBuckets } = await supabase
    .from('leave_quota')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('year', currentYear - 2)
    .order('year', { ascending: true }) // Oldest first guarantees priority deduction

  return finalBuckets || [];
}

export async function submitLeaveAction(category, datesStrArr, note) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: employee } = await supabase.from('employees').select('id').eq('auth_id', user.id).single()
  if (!employee) return { error: "No employee mapped" }

  // Enforce "One Pending Request" rule
  const { count: pendingCount } = await supabase
    .from('cuti')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employee.id)
    .eq('status', 'pending')

  if (pendingCount > 0) {
    return { error: "You already have a pending leave request. Please wait for it to be processed or delete it before submitting another." }
  }

  const daysRequested = datesStrArr.length;
  if (daysRequested === 0) return { error: "No dates selected" }

  if (category === 'Tahunan') {
    const currentYear = new Date().getFullYear();
    const buckets = await ensureAndCapQuotas(supabase, employee.id, currentYear)
    
    let totalAvailable = 0;
    const actionableBuckets = [];
    
    for (const b of buckets) {
      const remaining = b.total_days - b.used_days;
      if (remaining > 0) {
        totalAvailable += remaining;
        actionableBuckets.push({ ...b, remaining });
      }
    }

    if (totalAvailable < daysRequested) {
      return { error: `Insufficient Annual Leave quota. You requested ${daysRequested} days, but only have ${totalAvailable} available.` }
    }

    // Provision request
    const { data: cutiRow, error: cutiErr } = await supabase.from('cuti').insert({
      employee_id: employee.id,
      category,
      dates: datesStrArr,
      note,
      status: 'pending'
    }).select('id').single()

    if (cutiErr) return { error: cutiErr.message }

    const leaveId = cutiRow.id;
    let daysToDeduct = daysRequested;
    
    // Sequential deduction (waterfall) -> n-2, n-1, n
    for (const b of actionableBuckets) {
      if (daysToDeduct === 0) break;
      
      const deductionForThisBucket = Math.min(b.remaining, daysToDeduct);
      
      await supabase.from('leave_quota')
        .update({ used_days: b.used_days + deductionForThisBucket })
        .eq('id', b.id)

      await supabase.from('leave_quota_breakdown').insert({
        leave_id: leaveId,
        quota_year: b.year,
        days_deducted: deductionForThisBucket
      })

      daysToDeduct -= deductionForThisBucket;
    }
  } else {
    // Other categories process independently
    const { error: cutiErr } = await supabase.from('cuti').insert({
      employee_id: employee.id,
      category,
      dates: datesStrArr,
      note,
      status: 'pending'
    })
    if (cutiErr) return { error: cutiErr.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/form')
  revalidatePath('/admin/requests')
  return { success: true }
}

export async function updateLeaveStatusAction(requestId, newStatus) {
  const supabase = await createClient()
  
  const { data: request } = await supabase.from('cuti').select('*').eq('id', requestId).single()
  if (!request) return { error: "Request not found" }

  const { error } = await supabase.from('cuti').update({ status: newStatus }).eq('id', requestId)
  if (error) return { error: error.message }

  // Re-fund deductibles if rejected specifically for annual leave
  if ((newStatus === 'ditolak') && request.category === 'Tahunan') {
    const { data: breakdowns } = await supabase.from('leave_quota_breakdown').select('*').eq('leave_id', requestId)
    if (breakdowns && breakdowns.length > 0) {
      for (const bd of breakdowns) {
        const { data: bucket } = await supabase.from('leave_quota').select('id, used_days').eq('employee_id', request.employee_id).eq('year', bd.quota_year).single()
        if (bucket) {
           await supabase.from('leave_quota').update({ used_days: Math.max(0, bucket.used_days - bd.days_deducted) }).eq('id', bucket.id)
        }
      }
      await supabase.from('leave_quota_breakdown').delete().eq('leave_id', requestId)
    }
  }

  revalidatePath('/admin/requests')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getLeaveQuotaOverviewAction(employeeId) {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear();
  const buckets = await ensureAndCapQuotas(supabase, employeeId, currentYear);

  let totalAllowed = 0;
  let totalRemaining = 0;
  
  for (const b of buckets) {
      totalAllowed += b.total_days;
      totalRemaining += (b.total_days - b.used_days);
  }

  // Ensure we always have slots for n, n-1, n-2 even if they don't exist in DB
  const yearsToInclude = [currentYear, currentYear - 1, currentYear - 2];
  const bucketMap = new Map(buckets.map(b => [b.year, b]));
  
  const finalDisplayBuckets = yearsToInclude.map(year => {
    const b = bucketMap.get(year);
    if (b) {
      return {
        year: b.year,
        total: b.total_days,
        used: b.used_days,
        remaining: b.total_days - b.used_days,
        expires_at: b.expires_at
      };
    } else {
      // Placeholder for years without an active bucket
      return {
        year,
        total: 0,
        used: 0,
        remaining: 0,
        expires_at: null
      };
    }
  });

  return {
    totalAllowed,
    totalRemaining,
    used: totalAllowed - totalRemaining,
    progressPercent: totalAllowed > 0 ? Math.round(((totalAllowed - totalRemaining) / totalAllowed) * 100) : 0,
    buckets: finalDisplayBuckets.sort((a, b) => a.year - b.year)
  }
}

export async function deleteLeaveAction(requestId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  // Get request and verify ownership via the employee join
  const { data: request, error: fetchErr } = await supabase
    .from('cuti')
    .select('*, employees!inner(auth_id)')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: "Request not found" }
  
  // Security: only owner can delete their OWN PENDING request
  if (request.employees.auth_id !== user.id) return { error: "Unauthorized" }
  if (request.status !== 'pending') return { error: "Only pending requests can be deleted" }

  // Refund Quota if Tahunan
  if (request.category === 'Tahunan') {
    const { data: breakdowns } = await supabase
      .from('leave_quota_breakdown')
      .select('*')
      .eq('leave_id', requestId)
      
    if (breakdowns && breakdowns.length > 0) {
      for (const bd of breakdowns) {
        const { data: bucket } = await supabase
          .from('leave_quota')
          .select('id, used_days')
          .eq('employee_id', request.employee_id)
          .eq('year', bd.quota_year)
          .single()
          
        if (bucket) {
          await supabase
            .from('leave_quota')
            .update({ used_days: Math.max(0, bucket.used_days - bd.days_deducted) })
            .eq('id', bucket.id)
        }
      }
      // Clean up breakdowns manually before record deletion just in case
      await supabase.from('leave_quota_breakdown').delete().eq('leave_id', requestId)
    }
  }

  // Delete the record
  const { error } = await supabase.from('cuti').delete().eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/requests')
  return { success: true }
}
