import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StampManager from '@/components/ui/StampManager'
import { ManageTabs } from '../ManageTabs'

export default async function AdminStampsPage() {
  const supabase = await createClient()

  // 1. Authenticate and verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Dokumen</h1>
        <p className="text-slate-500 mt-1">Ubah pengaturan, kelola lampiran, tanda tangan, dan stempel unit.</p>
      </div>

      <ManageTabs />

      <div className="rounded-md border p-6 bg-slate-50/50 shadow-sm">
        <StampManager />
      </div>
    </div>
  )
}
