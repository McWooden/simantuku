import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminRequestsList } from './AdminRequestsList'

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') redirect('/dashboard')

  // Fetch all requests with employee information
  const { data: requests, error } = await supabase
    .from('cuti')
    .select(`
      *,
      employee:employees!employee_id (
        name
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Permintaan Cuti</h1>
          <p className="text-muted-foreground mt-1">
            Tinjau dan kelola semua pengajuan cuti pegawai serta permintaan yang ditujukan langsung ke Anda.
          </p>
        </div>
      </div>

      <AdminRequestsList 
        initialRequests={requests || []} 
        currentEmployeeId={employee.id} 
      />
    </div>
  )
}
