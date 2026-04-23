import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export default async function AdminUnlinkedLoginsPage() {
  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (adminEmployee?.role !== 'admin') redirect('/dashboard')

  // Find users in `profiles` (which logs all authentications) 
  // that do not have a matching `auth_id` in `employees`.
  // Wait, `profiles` might not have email. Another way is to query Supabase Auth directly via Admin API,
  // but if we only have access to Public `profiles` table:
  const { data: authProfiles } = await supabase
    .from('profiles')
    .select('id, username, email, created_at')
    .order('created_at', { ascending: false })

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name, email, auth_id')

  // Find auth profiles that are NOT linked in employees
  const linkedAuthIds = employees.filter(e => e.auth_id).map(e => e.auth_id)
  const unlinkedProfiles = authProfiles?.filter(p => !linkedAuthIds.includes(p.id)) || []

  // Server Action to link an account
  async function linkAccount(formData) {
    'use server'
    const profileId = formData.get('profileId')
    const employeeId = formData.get('employeeId')

    const supabaseServer = await createClient()

    const { error } = await supabaseServer
      .from('employees')
      .update({ auth_id: profileId })
      .eq('id', employeeId)

    if (error) {
      console.error('Failed to link account:', error)
    }

    revalidatePath('/admin/unlinked-logins')
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Login Belum Tertaut</h1>
          <p className="text-muted-foreground">
            Pengguna yang masuk melalui Google tetapi belum dipetakan ke Rekam Data Pegawai Resmi.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/employees/create">
            <Plus className="mr-2 h-4 w-4" /> Tambah Pegawai
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Akun Google / Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tanggal Login</TableHead>
              <TableHead>Tautkan ke Profil Pegawai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unlinkedProfiles.length > 0 ? (
              unlinkedProfiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.username}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email || 'N/A'}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col lg:flex-row gap-2 items-center">
                      <form action={linkAccount} className="flex gap-2 items-center w-full">
                        <input type="hidden" name="profileId" value={p.id} />
                        <select
                          name="employeeId"
                          required
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Pilih Pegawai...</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.email}) {emp.auth_id ? '- (Tugaskan Ulang)' : ''}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" size="sm">Tautkan</Button>
                      </form>
                      <Button asChild size="sm" variant="outline" className="border-dashed whitespace-nowrap shrink-0">
                        <Link href={`/admin/employees/create?email=${encodeURIComponent(p.email || '')}&name=${encodeURIComponent(p.username || '')}`}>
                          <Plus className="h-3 w-3 mr-1" /> Buat Baru
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Tidak ada login yang belum tertaut.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
