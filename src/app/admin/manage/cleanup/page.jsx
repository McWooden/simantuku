import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CleanupForm from './CleanupForm'

export default async function AdminCleanupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin' && employee?.role !== 'manager') redirect('/dashboard')

  const { count } = await supabase
    .from('cuti')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ditolak')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CleanupForm rejectedCount={count || 0} />
    </div>
  )
}
