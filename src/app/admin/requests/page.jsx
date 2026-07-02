import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminRequestsList } from './AdminRequestsList'
import { Suspense } from 'react'

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin' && employee?.role !== 'manager') redirect('/dashboard')

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

      <Suspense fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-20 flex flex-col items-center justify-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-slate-500">Memuat antarmuka...</span>
        </div>
      }>
        <AdminRequestsList 
          currentEmployeeId={employee.id} 
          currentEmployeeRole={employee.role}
        />
      </Suspense>
    </div>
  )
}
