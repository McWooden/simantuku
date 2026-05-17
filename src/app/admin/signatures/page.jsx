import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignatureForm from './SignatureForm'

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

  if (employee?.role !== 'admin') redirect('/dashboard')

  // 2. Fetch all employees to populate the dropdown
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('id, name, nip')
    .order('name', { ascending: true })

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kelola Tanda Tangan</h1>
        <p className="text-muted-foreground">
          Unggah tanda tangan (PNG Transparan) untuk pegawai.
        </p>
      </div>

      <div className="rounded-md border p-6 bg-card">
        <SignatureForm employees={allEmployees} />
      </div>
    </div>
  )
}
