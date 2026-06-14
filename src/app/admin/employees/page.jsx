import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLeaveQuotaOverviewAction } from '@/app/actions/leaveActions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EmployeeList } from './EmployeeList'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin' && employee?.role !== 'manager') redirect('/dashboard')

  // Fetch all users and their leave counts
  // For simplicity, we fetch all profiles and all approved 'Tahunan' leaves
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true })

  // Calculate true quota for each user using the advanced bucket system
  const userStats = await Promise.all(
    allEmployees.map(async (u) => {
      let overview;
      try {
        overview = await getLeaveQuotaOverviewAction(u.id);
      } catch (e) {
        overview = { used: 0, totalRemaining: 0 };
      }
      return {
        ...u,
        daysUsed: overview.used,
        remaining: overview.totalRemaining,
      }
    })
  )

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Direktori Pegawai</h1>
          <p className="text-slate-500 mt-1">
            Lihat daftar semua pegawai dan saldo cuti mereka.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 shadow-sm rounded-xl">
          <Link href="/admin/employees/create">
            <Plus className="mr-2 h-4 w-4" /> Tambah Pegawai
          </Link>
        </Button>
      </div>

      <EmployeeList initialEmployees={userStats || []} />
    </div>
  )
}
