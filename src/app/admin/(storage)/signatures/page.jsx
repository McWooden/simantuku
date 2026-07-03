import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignatureList from './SignatureList'

export default async function AdminSignaturesPage() {
  const supabase = await createClient()

  // 1. Authenticate and verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin' && employee?.role !== 'manager') redirect('/dashboard')

  // 2. Fetch all employees to populate the list
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('id, name, nip')
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-md border p-6 bg-slate-50/50 shadow-sm">
        <SignatureList employees={allEmployees} />
      </div>
    </div>
  )
}
