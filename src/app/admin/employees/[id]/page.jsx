import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, AlertCircle, Edit } from 'lucide-react'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { DownloadPdfButton } from '@/components/ui/DownloadPdfButton'
import { NipPasswordToggle } from '@/components/ui/NipPasswordToggle'

function parseDateString(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export default async function UserProfilePage({ params }) {
  const { id } = await params
  
  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (adminEmployee?.role !== 'admin' && adminEmployee?.role !== 'manager') redirect('/dashboard')

  // Fetch the target employee's profile
  const { data: targetEmployee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (!targetEmployee) redirect('/admin/employees')

  // Calculate leave quota using the new advanced bucket logic
  const { getLeaveQuotaOverviewAction } = await import('@/app/actions/leaveActions')
  const quotaOverview = await getLeaveQuotaOverviewAction(targetEmployee.id)
  const remainingQuota = quotaOverview.totalRemaining
  const totalAllowed = quotaOverview.totalAllowed
  const progressPercent = quotaOverview.progressPercent
  const buckets = quotaOverview.buckets || []
  const currentYear = new Date().getFullYear()

  // Fetch target employee's leave requests with relations
  const { data: leaveHistory } = await supabase
    .from('cuti')
    .select(`
      *,
      atasan:employees!atasan_id(id, name, nip, position, unit),
      pejabat:employees!pejabat_id(id, name, nip, position, unit)
    `)
    .eq('employee_id', targetEmployee.id)
    .order('created_at', { ascending: false })

  // Fetch signature status
  const { data: sigFiles } = await supabase.storage
    .from('signatures')
    .list(id)
  const hasSignature = sigFiles && sigFiles.some(f => f.name === 'signature.png')
  let signatureUrl = null
  if (hasSignature) {
    const { data } = await supabase.storage.from('signatures').createSignedUrl(`${id}/signature.png`, 3600)
    signatureUrl = data?.signedUrl || null
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <Button variant="ghost" asChild className="-ml-4">
        <Link href="/admin/employees">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Pegawai
        </Link>
      </Button>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-600 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <p suppressHydrationWarning className="text-primary-foreground/80 font-medium mb-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Profil Pegawai: {targetEmployee.name}
          </h1>
          <p className="text-primary-foreground/90 max-w-md">
            Berikut adalah rincian profil, kuota cuti, dan riwayat pengajuan cuti resmi pegawai.
          </p>
        </div>
        {/* Abstract shapes for background */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-32 translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Advanced Quota Card */}
        <Card className="col-span-1 border-none shadow-md bg-white overflow-hidden relative group hover:shadow-xl transition-all duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Kuota Cuti Tahunan</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-primary tracking-tighter">
                    {remainingQuota}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground mb-1">
                    / {totalAllowed}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>
            
            <div className="mt-6 w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Rincian Kuota</p>
              {buckets.slice().reverse().map((bucket) => (
                <div key={bucket.year} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">
                      Tahun {bucket.year} 
                      {bucket.year === currentYear ? (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">Tahun Ini</span>
                      ) : bucket.year === currentYear - 1 ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1 text-[9px]">Tahun Lalu</span>
                      ) : bucket.year === currentYear - 2 ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1 text-[9px]">2 Tahun Lalu</span>
                      ) : null}
                    </span>
                    {bucket.expires_at && (
                      <span className="text-[10px] text-muted-foreground">Kedaluwarsa {format(new Date(bucket.expires_at), 'd MMM yyyy', { locale: localeId })}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{bucket.remaining}</span>
                    <span className="text-slate-400"> / {bucket.total} d</span>
                  </div>
                </div>
              ))}
            </div>

             <p className="text-[10px] text-muted-foreground mt-4 italic">
               * Kuota tahunan dihitung berdasarkan tahun kalender berjalan. Sisa cuti tidak diakumulasikan ke tahun berikutnya.
             </p>
          </CardContent>
        </Card>

        {/* Attribute Panel */}
        <Card className="md:col-span-2 border-none shadow-md bg-white hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-violet-100 rounded-full blur-2xl transition-transform group-hover:scale-125" />
          <CardContent className="p-6 relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 relative">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detail Pegawai</h3>
                <p className="text-xs text-muted-foreground">Informasi lengkap profil resmi pegawai.</p>
              </div>
              <Link href={`/admin/employees/edit?id=${targetEmployee.id}`} className="absolute top-4 right-4">
                <Button variant="outline" size="sm" className="h-8">
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Ubah Profil
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Nama Lengkap</span>
                <span className="font-semibold text-slate-800 block mt-1 text-base">{targetEmployee.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Email Resmi</span>
                <span className="font-semibold text-slate-800 block mt-1">{targetEmployee.email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Jabatan</span>
                <span className="font-semibold text-slate-800 block mt-1">{targetEmployee.position || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Unit Kerja</span>
                <span className="font-semibold text-slate-800 block mt-1">{targetEmployee.unit || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">NIP</span>
                <span className="font-semibold text-slate-800 block mt-1">{targetEmployee.nip || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Nomor Telepon</span>
                <span className="font-semibold text-slate-800 block mt-1">{targetEmployee.phone_number || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Tanggal Mulai Kerja</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {targetEmployee.start_date ? format(new Date(targetEmployee.start_date), 'd MMMM yyyy', { locale: localeId }) : '-'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Atasan Langsung / Atas Atasan Langsung</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {targetEmployee.is_superior ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs text-muted-foreground block">Peran Sistem</span>
                <div className="mt-1">
                  <Badge variant={targetEmployee.role === 'admin' || targetEmployee.role === 'manager' ? 'default' : 'secondary'}>
                    {targetEmployee.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs text-muted-foreground block">Tanda Tangan</span>
                <div className="mt-2">
                  {signatureUrl ? (
                    <div className="h-16 w-36 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center overflow-hidden" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '6px 6px' }}>
                      <img src={signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain drop-shadow-sm" />
                    </div>
                  ) : (
                    <span className="text-xs text-red-500 italic font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Belum mengunggah tanda tangan resmi
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Account Security Settings */}
            <div className="pt-6 border-t border-slate-100">
              <NipPasswordToggle employee={targetEmployee} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave History List */}
      <div className="space-y-4">
        <h2 id="recent-requests" className="text-2xl font-bold tracking-tight pt-2">Riwayat Permintaan Cuti</h2>

        <div className="flex flex-col gap-3">
          {leaveHistory && leaveHistory.length > 0 ? (
            leaveHistory.map((leave) => {
              const isAcc = leave.status === 'acc'
              const isRejected = leave.status === 'ditolak'
              
              return (
                <div 
                  key={leave.id} 
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors duration-300 flex items-center justify-between p-5 flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-start gap-4 w-full sm:w-auto flex-1 min-w-0">
                    <div className="p-2 rounded-full mt-0.5 bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                      {isAcc ? <CheckCircle2 className="w-4 h-4" /> : 
                       isRejected ? <AlertCircle className="w-4 h-4" /> : 
                       <Clock className="w-4 h-4" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/requests/${leave.id}`} className="hover:underline text-slate-800">
                        <h4 className="font-semibold text-base mb-0.5">{leave.category}</h4>
                      </Link>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <DateDetailsModal dates={leave.dates}>
                          <button suppressHydrationWarning className="text-sm text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5 whitespace-nowrap">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {leave.dates && leave.dates.length > 0 ? (
                              leave.dates.length === 1 ? (
                                format(parseDateString(leave.dates[0]), "d MMMM yyyy", { locale: localeId })
                              ) : (
                                `${format(parseDateString(leave.dates[0]), "d MMM yyyy", { locale: localeId })} - ${format(parseDateString(leave.dates[leave.dates.length - 1]), "d MMM", { locale: localeId })} (${leave.dates.length} days)`
                              )
                            ) : (
                              format(new Date(leave.created_at), "d MMMM yyyy", { locale: localeId })
                            )}
                          </button>
                        </DateDetailsModal>
                        {leave.note && (
                          <>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="text-sm text-slate-500 truncate" title={leave.note}>
                              {leave.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <DownloadPdfButton 
                      pdfData={{
                        employeeId: targetEmployee.id,
                        status: leave.status,
                        name: targetEmployee.name,
                        nip: targetEmployee.nip,
                        position: targetEmployee.position,
                        unit: targetEmployee.unit,
                        phone: targetEmployee.phone_number,
                        employeeStartDate: targetEmployee.start_date,
                        category: leave.category,
                        dates: leave.dates,
                        note: leave.note,
                        address: leave.address,
                        recipientType: leave.recipient_type,
                        atasan: leave.atasan,
                        pejabat: leave.pejabat,
                        isAtasanApproved: leave.is_atasan_approved,
                        isPejabatApproved: leave.is_pejabat_approved,
                        quotas: {
                           sisaN: (buckets.find(b => b.year === currentYear)?.remaining || 0) + (leave.dates && leave.dates.length > 0 && new Date(leave.dates[0]).getFullYear() === currentYear && leave.status === 'acc' && leave.category === 'Tahunan' ? leave.dates.length : 0),
                           sisaN1: (buckets.find(b => b.year === currentYear - 1)?.remaining || 0) + (leave.dates && leave.dates.length > 0 && new Date(leave.dates[0]).getFullYear() === currentYear - 1 && leave.status === 'acc' && leave.category === 'Tahunan' ? leave.dates.length : 0),
                           sisaN2: (buckets.find(b => b.year === currentYear - 2)?.remaining || 0) + (leave.dates && leave.dates.length > 0 && new Date(leave.dates[0]).getFullYear() === currentYear - 2 && leave.status === 'acc' && leave.category === 'Tahunan' ? leave.dates.length : 0)
                        }
                      }}
                      size="sm" 
                      variant="ghost" 
                      className="text-muted-foreground hover:text-primary gap-1.5 h-8 px-2"
                    />
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide
                      ${isAcc ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isRejected ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada permintaan</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Pegawai ini belum memiliki riwayat pengajuan cuti.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
