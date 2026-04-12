'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEmployeeAction(employeeId, data) {
  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authorized" }

  const { data: adminEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (adminEmployee?.role !== 'admin') return { error: "Not authorized" }

  // Basic validation if name is being updated
  if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
    return { error: "Name cannot be empty" }
  }

  const { error } = await supabase
    .from('employees')
    .update(data)
    .eq('id', employeeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/employees')
  revalidatePath(`/admin/employees/${employeeId}`)

  return { success: true }
}
