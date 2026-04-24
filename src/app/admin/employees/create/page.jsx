import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const POSITIONS = [
  "Arsiparis Pelaksana / Terampil",
  "Camat Magelang Utara",
  "Ka. Seksi Ketentraman, Ketertiban Umum Dan Perlindungan Masyarakat",
  "Kasi. Ketentraman, Ketertiban Umum Dan Perlindungan Masyarakat",
  "Kasi. Pelayanan Umum",
  "Kasi. Pemberdayaan Masyarakat Dan Pembangunan",
  "Kasi. Pemerintahan",
  "Kasubag. Program Dan Keuangan",
  "Kasubag. Umum Dan Kepegawaian",
  "Kepala Badan Kepegawaian Dan Pengembangan Sumber Daya Manusia",
  "Lurah Kedungsari",
  "Lurah Kramat Selatan",
  "Lurah Kramat Utara",
  "Lurah Potrobangsan",
  "Lurah Wates",
  "Penelaah Teknis Kebijakan",
  "Pengadministrasi Perkantoran",
  "Pj. Sekretaris Daerah",
  "Pranata Komputer Mahir",
  "Pranata Komputer Pelaksana",
  "Sekretaris Kecamatan",
  "Sekretaris Kelurahan",
  "Sekretaris Kelurahan Kedungsari",
  "Sekretaris Kelurahan Kramat Selatan",
  "Sekretaris Kelurahan Kramat Utara",
  "Sekretaris Kelurahan Wates",
  "Wali Kota Magelang"
]

const UNITS = [
  "Kelurahan Kedungsari",
  "Kelurahan Kramat Selatan",
  "Kelurahan Kramat Utara",
  "Kelurahan Potrobangsan",
  "Kelurahan Wates"
]

export default async function CreateEmployeePage({ searchParams }) {
  const params = await searchParams;
  const defaultEmail = params?.email || '';
  const defaultName = params?.name || '';

  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') redirect('/dashboard')

  async function createEmployee(formData) {
    'use server'
    const name = formData.get('name')
    const email = formData.get('email')
    const role = formData.get('role')
    const start_date = formData.get('start_date') || null
    let position = formData.get('position') || null
    let unit = formData.get('unit') || null
    if (unit === 'none') unit = null // handle 'none' option
    const nip = formData.get('nip') || null
    const phone_number = formData.get('phone_number') || null

    const supabaseServer = await createClient()

    const { error } = await supabaseServer
      .from('employees')
      .insert({ name, email, role, start_date, position, unit, nip, phone_number })

    if (error) {
      console.error('Error creating employee:', error)
      // Throwing error from server action will require an error boundary or returning an error state.
      // For simplicity, we just redirect back with error in query
      // (a real app would use useActionState but this works for basic flow)
      return redirect(`/admin/employees/create?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/admin/employees')
    redirect('/admin/employees')
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Pegawai</h1>
          <p className="text-muted-foreground">Tambahkan profil pegawai resmi baru.</p>
        </div>
      </div>

      <Card>
        <form action={createEmployee}>
          <CardHeader>
            <CardTitle>Detail Pegawai</CardTitle>
            <CardDescription>
              Masukkan detail resmi organisasi pegawai. Email ini akan digunakan untuk menautkan akun mereka secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" defaultValue={defaultName} placeholder="Contoh: John Doe" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Resmi</Label>
              <Input id="email" name="email" type="email" defaultValue={defaultEmail} placeholder="Contoh: john@example.com" required />
              <p className="text-xs text-muted-foreground">
                Harus sama dengan email akun Google untuk penautan otomatis.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Peran</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger id="role" name="role">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Pengguna</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>
              <Select name="position" required>
                <SelectTrigger id="position">
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit Kerja (Opsional)</Label>
              <Select name="unit" defaultValue="none">
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Kosong --</SelectItem>
                  {UNITS.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip">nip (Opsional)</Label>
              <Input id="nip" name="nip" placeholder="Maksimal 18 karakter nip" maxLength={18} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Nomor Telepon (Opsional)</Label>
              <Input id="phone_number" name="phone_number" type="tel" placeholder="Contoh: 08123456789" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai Kerja (Opsional)</Label>
              <Input id="start_date" name="start_date" type="date" />
              <p className="text-xs text-muted-foreground">
                Tanggal saat pegawai ini resmi mulai bekerja.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild variant="ghost">
              <Link href="/admin/employees">Batal</Link>
            </Button>
            <Button type="submit">Tambah Pegawai</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
