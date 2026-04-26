import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, CheckCircle, ArrowRight, Clock, ShieldCheck, Activity, Link2 } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get current session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch admin profile
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!employee || employee.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch Stats
  const { count: pendingCount } = await supabase
    .from('cuti')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: employeeCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })

  const { count: approvedCount } = await supabase
    .from('cuti')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'acc')

  return (
    <div className="space-y-8 pt-4">
      {/* Admin Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 mix-blend-overlay" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-3 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Akses Administratif
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Pusat Kontrol
            </h1>
            <p className="text-slate-300 max-w-xl">
              Pantau permintaan masuk, kelola profil pegawai, dan lihat metrik cuti organisasi.
            </p>
          </div>
          
          <div className="hidden md:flex p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-full">
              <Activity className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Status Sistem</p>
              <p className="text-lg font-bold text-emerald-400">Semua Sistem Normal</p>
            </div>
          </div>
        </div>
        
        {/* Background shapes */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Ribbon */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-32 h-32" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Permintaan Menunggu
            </h3>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-black text-slate-800 tracking-tighter">
                {pendingCount || 0}
              </div>
              <Link href="/admin/requests" className="text-sm font-medium text-primary hover:underline group-hover:translate-x-1 transition-transform inline-flex items-center">
                Tinjau <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </CardContent>
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-200" />
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-32 h-32" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Pegawai Aktif
            </h3>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-black text-slate-800 tracking-tighter">
                {employeeCount || 0}
              </div>
              <Link href="/admin/employees" className="text-sm font-medium text-primary hover:underline group-hover:translate-x-1 transition-transform inline-flex items-center">
                Kelola <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </CardContent>
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-400" />
        </Card>

        <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle className="w-32 h-32" />
          </div>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cuti Disetujui
            </h3>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-black text-slate-800 tracking-tighter">
                {approvedCount || 0}
              </div>
              <span className="text-sm font-medium text-muted-foreground inline-flex items-center">
                Sepanjang Waktu
              </span>
            </div>
          </CardContent>
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-200" />
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <h2 className="text-2xl font-bold tracking-tight pt-4">Aksi Cepat</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/admin/requests" className="group block focus:outline-none">
          <div className="p-6 rounded-2xl bg-white border border-border/50 hover:border-amber-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-125" />
            <div className="flex items-start gap-4">
              <div className="p-4 bg-amber-100/50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-amber-700 transition-colors">Tinjau Permintaan Cuti</h3>
                <p className="text-muted-foreground">Setujui atau tolak pengajuan cuti pegawai dan periksa sisa kuota.</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/employees" className="group block focus:outline-none">
          <div className="p-6 rounded-2xl bg-white border border-border/50 hover:border-indigo-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-125" />
            <div className="flex items-start gap-4">
              <div className="p-4 bg-indigo-100/50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">Direktori Pegawai</h3>
                <p className="text-muted-foreground">Kelola tim Anda, buat profil resmi, dan perbarui saldo kuota.</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/unlinked-logins" className="group block focus:outline-none md:col-span-2 lg:col-span-1">
          <div className="p-6 rounded-2xl bg-white border border-border/50 hover:border-emerald-200 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-125" />
            <div className="flex items-start gap-4">
              <div className="p-4 bg-emerald-100/50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Link2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">Akses Tertunda (Belum Ditautkan)</h3>
                <p className="text-muted-foreground">Tautkan akun Google baru ke Direktori Pegawai resmi.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
