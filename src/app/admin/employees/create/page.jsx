import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateEmployeeAction } from '@/app/actions/employeeActions'
import { AlertCircle } from 'lucide-react'

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

/**
 * Page component that handles both creating a new employee and editing an existing one.
 * If `searchParams.id` is present, the page loads the employee data and switches to edit mode.
 */
export default async function CreateOrEditEmployeePage({ searchParams }) {
  const supabase = await createClient()

  // Ensure user is authenticated and is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (currentUser?.role !== 'admin') redirect('/dashboard')

  const resolvedSearchParams = await searchParams
  const errorMsg = resolvedSearchParams?.error || null

  // Detect edit mode
  const employeeId = resolvedSearchParams?.id || null
  let employee = null
  if (employeeId) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()
    if (error) {
      console.error('Failed to fetch employee', error)
      redirect('/admin/employees')
    }
    employee = data
  }

  const defaultEmail = employee?.email || resolvedSearchParams?.email || ''
  const defaultName = employee?.name || resolvedSearchParams?.name || ''
  const defaultPosition = employee?.position || resolvedSearchParams?.position || 'none'
  const defaultUnit = employee?.unit || resolvedSearchParams?.unit || 'none'
  const defaultNip = employee?.nip || resolvedSearchParams?.nip || ''
  const defaultPhone = employee?.phone_number || resolvedSearchParams?.phone_number || ''

  let defaultStartDate = ''
  if (employee?.start_date) {
    defaultStartDate = new Date(employee.start_date).toISOString().split('T')[0]
  } else if (resolvedSearchParams?.start_date) {
    defaultStartDate = resolvedSearchParams.start_date
  }

  const defaultIsSuperior = employee?.is_superior ? 'true' : (resolvedSearchParams?.is_superior === 'true' ? 'true' : 'false')
  const defaultRole = employee?.role || resolvedSearchParams?.role || 'user'

  const hasNipError = errorMsg && errorMsg.toLowerCase().includes('nip')
  const hasEmailError = errorMsg && errorMsg.toLowerCase().includes('email')

  // Server action to handle both create and update
  async function handleSubmit(formData) {
    'use server'
    const isEdit = !!employeeId
    const payload = {
      name: formData.get('name')?.trim() || null,
      email: formData.get('email')?.trim() || null,
      role: formData.get('role') || 'user',
      start_date: formData.get('start_date') || null,
      position: formData.get('position')?.trim() || null,
      unit: formData.get('unit')?.trim() || null,
      nip: formData.get('nip')?.trim() || null,
      phone_number: formData.get('phone_number')?.trim() || null,
      is_superior: formData.get('is_superior') === 'true'
    }
    if (payload.unit === 'none' || payload.unit === '') payload.unit = null
    if (payload.position === 'none' || payload.position === '') payload.position = null

    const supabaseServer = await createClient()
    let error
    if (isEdit) {
      const { error: err } = await supabaseServer
        .from('employees')
        .update(payload)
        .eq('id', employeeId)
      error = err
    } else {
      const { error: err } = await supabaseServer
        .from('employees')
        .insert(payload)
      error = err
    }
    if (error) {
      console.error(isEdit ? 'Error updating employee' : 'Error creating employee', error)

      const queryParams = new URLSearchParams()
      queryParams.set('error', error.message)
      if (payload.name) queryParams.set('name', payload.name)
      if (payload.email) queryParams.set('email', payload.email)
      if (payload.role) queryParams.set('role', payload.role)
      if (payload.start_date) queryParams.set('start_date', payload.start_date)
      if (payload.position) queryParams.set('position', payload.position)
      if (payload.unit) queryParams.set('unit', payload.unit)
      if (payload.nip) queryParams.set('nip', payload.nip)
      if (payload.phone_number) queryParams.set('phone_number', payload.phone_number)
      queryParams.set('is_superior', payload.is_superior ? 'true' : 'false')

      if (isEdit) {
        queryParams.set('id', employeeId)
        return redirect(`/admin/employees/edit?${queryParams.toString()}`)
      } else {
        return redirect(`/admin/employees/create?${queryParams.toString()}`)
      }
    }
    revalidatePath('/admin/employees')
    redirect('/admin/employees')
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {employeeId ? 'Ubah Pegawai' : 'Tambah Pegawai'}
          </h1>
          <p className="text-muted-foreground">
            {employeeId ? 'Ubah profil pegawai resmi.' : 'Tambahkan profil pegawai resmi baru.'}
          </p>
          <p className="text-muted-foreground">
            Tanda <span className="text-primary font-bold">*</span> menunjukkan kolom yang wajib diisi.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Gagal menyimpan data</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      <Card>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap <span className="text-primary font-bold">*</span></Label>
              <Input id="name" name="name" defaultValue={defaultName} placeholder="Contoh: John Doe" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip" className={hasNipError ? 'text-destructive' : ''}>NIP <span className="text-primary font-bold">*</span></Label>
              <Input
                id="nip"
                name="nip"
                placeholder="Maksimal 19 karakter NIP"
                maxLength={19}
                defaultValue={defaultNip}
                required
                className={hasNipError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {hasNipError && <p className="text-xs text-destructive">NIP sudah digunakan oleh pegawai lain.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={hasEmailError ? 'text-destructive' : ''}>Email Resmi</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultEmail}
                placeholder="Contoh: john@example.com (Kosongkan jika belum ada)"
                className={hasEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {hasEmailError && <p className="text-xs text-destructive">Email sudah digunakan oleh pegawai lain.</p>}
              <p className="text-xs text-muted-foreground">Harus sama dengan email akun Google untuk penautan otomatis jika menggunakan Google Login.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>
              <Input
                id="position"
                name="position"
                list="positions-list"
                defaultValue={defaultPosition === 'none' ? '' : defaultPosition}
                placeholder="Ketik atau pilih jabatan..."
                className="bg-white"
              />
              <datalist id="positions-list">
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit Kerja</Label>
              <Input
                id="unit"
                name="unit"
                list="units-list"
                defaultValue={defaultUnit === 'none' ? '' : defaultUnit}
                placeholder="Ketik atau pilih unit kerja..."
                className="bg-white"
              />
              <datalist id="units-list">
                {UNITS.map(u => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Nomor Telepon</Label>
              <Input id="phone_number" name="phone_number" type="tel" placeholder="Contoh: 08123456789" defaultValue={defaultPhone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai Kerja</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={defaultStartDate} />
              <p className="text-xs text-muted-foreground">Tanggal saat pegawai ini resmi mulai bekerja.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_superior">Apakah pegawai ini atasan langsung / atas atasan langsung?</Label>
              <Select name="is_superior" defaultValue={defaultIsSuperior}>
                <SelectTrigger id="is_superior">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Tidak</SelectItem>
                  <SelectItem value="true">Ya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Peran</Label>
              <Select name="role" defaultValue={defaultRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Pengguna</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild variant="ghost">
              <Link href="/admin/employees">Batal</Link>
            </Button>
            <SubmitButton loadingText={employeeId ? 'Menyimpan Perubahan...' : 'Menambahkan Pegawai...'}>
              {employeeId ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
