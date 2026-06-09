import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'
import { CalendarDays, PlusCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { CancelLeaveButton } from './CancelLeaveButton'
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

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  const getJakartaParts = (d) => {
    const jkt = new Date(d.getTime() + (7 * 3600000));
    return {
      year: jkt.getUTCFullYear(),
      month: jkt.getUTCMonth(),
      day: jkt.getUTCDate(),
      hours: jkt.getUTCHours(),
      minutes: jkt.getUTCMinutes()
    };
  };

  const dateParts = getJakartaParts(date);
  const nowParts = getJakartaParts(now);

  const formatTime = () => {
    const h = String(dateParts.hours).padStart(2, '0');
    const m = String(dateParts.minutes).padStart(2, '0');
    return `${h}:${m}`;
  };

  const getIndoMonth = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[dateParts.month];
  };

  const isSameDay = dateParts.day === nowParts.day &&
                    dateParts.month === nowParts.month &&
                    dateParts.year === nowParts.year;

  const yesterday = new Date(now.getTime() - 24 * 3600000);
  const yesterdayParts = getJakartaParts(yesterday);
  const isYesterday = dateParts.day === yesterdayParts.day &&
                      dateParts.month === yesterdayParts.month &&
                      dateParts.year === yesterdayParts.year;

  const isSameYear = dateParts.year === nowParts.year;

  if (diffSeconds < 60) {
    const secs = Math.max(1, diffSeconds);
    return `Dibuat ${secs} detik lalu`;
  }
  
  if (diffMinutes < 60) {
    return `Dibuat ${diffMinutes} menit lalu`;
  }

  if (isSameDay) {
    return `Dibuat ${diffHours} jam lalu`;
  }

  if (isYesterday) {
    return `kemarin - ${formatTime()}`;
  }

  if (isSameYear) {
    return `${dateParts.day} ${getIndoMonth()} - ${formatTime()}`;
  }

  return `${dateParts.day} ${getIndoMonth()} ${dateParts.year} - ${formatTime()}`;
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Official Employee profile
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!employee) {
    redirect('/pending')
  }

  // Calculate leave quota using the new advanced bucket logic
  const { getLeaveQuotaOverviewAction } = await import('@/app/actions/leaveActions')
  const quotaOverview = await getLeaveQuotaOverviewAction(employee.id)
  const remainingQuota = quotaOverview.totalRemaining
  const totalAllowed = quotaOverview.totalAllowed
  const progressPercent = quotaOverview.progressPercent
  const buckets = quotaOverview.buckets || []
  const currentYear = new Date().getFullYear();

  // Fetch recent leave history
  // Fetch recent leave history with relations
  const { data: leaveHistory } = await supabase
    .from('cuti')
    .select(`
      *,
      atasan:employees!atasan_id(id, name, nip, position, unit),
      pejabat:employees!pejabat_id(id, name, nip, position, unit)
    `)
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const hasPending = leaveHistory?.some(l => l.status === 'pending');

  const hasMissingProfileInfo = !employee.position ||
    !employee.unit ||
    !employee.nip ||
    !employee.phone_number ||
    !employee.start_date;

  // Fetch signature status
  const { data: sigFiles } = await supabase.storage
    .from('signatures')
    .list(employee.id)
  const hasSignature = sigFiles && sigFiles.some(f => f.name === 'signature.png')
  let signatureUrl = null
  if (hasSignature) {
    const { data } = await supabase.storage.from('signatures').createSignedUrl(`${employee.id}/signature.png`, 3600)
    signatureUrl = data?.signedUrl || null
  }

  return (
    <div className="space-y-8 pt-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-600 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <p suppressHydrationWarning className="text-primary-foreground/80 font-medium mb-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Selamat datang kembali, {employee.name}!
          </h1>
          <p className="text-primary-foreground/90 max-w-md">
            Berikut ini adalah ikhtisar sisa cuti Anda dan permintaan cuti terbaru.
          </p>
        </div>
        {/* Abstract shapes for background */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-32 translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-xl" />
      </div>



      <div className="grid gap-6 md:grid-cols-3">
        {/* Advanced Quota Card */}
        <Card className="col-span-1 border-none shadow-md bg-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <CardContent className="p-6 relative flex-1 flex flex-col justify-between">
            <div>
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
                        <span className="text-[10px] text-muted-foreground">Kedaluwarsa {format(new Date(bucket.expires_at), 'd MMM yyyy', { locale: id })}</span>
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
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button className="w-full rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all" asChild>
                <Link href="/dashboard/form">
                  <PlusCircle className="mr-2 h-4 w-4" /> Ajukan Cuti
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attribute Panel (Detail Pegawai) */}
        <Card className="md:col-span-2 border-none shadow-md bg-white hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-violet-100 rounded-full blur-2xl transition-transform group-hover:scale-125" />
          <CardContent className="p-6 relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detail Pegawai</h3>
                <p className="text-xs text-muted-foreground">Informasi lengkap profil resmi Anda.</p>
              </div>
            </div>

            {hasMissingProfileInfo && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 shadow-xs animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h5 className="font-bold text-xs uppercase tracking-wider mb-1">Pemberitahuan Data Profil</h5>
                  <p className="text-xs leading-relaxed text-amber-700">
                    Hubungi Admin jika terdapat data profil yang tidak valid atau belum lengkap agar seluruh dokumen pengajuan cuti Anda tercetak dengan sempurna.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Nama Lengkap</span>
                <span className="font-semibold text-slate-800 block mt-1">{employee.name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Email Resmi</span>
                <span className="font-semibold text-slate-800 block mt-1">{employee.email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Jabatan</span>
                <span className="font-semibold text-slate-800 block mt-1">{employee.position || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Unit Kerja</span>
                <span className="font-semibold text-slate-800 block mt-1">{employee.unit || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">NIP</span>
                <span className="font-semibold text-slate-800 block mt-1">{employee.nip || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Nomor Telepon</span>
                <span className="font-semibold text-slate-800 block mt-1">{employee.phone_number || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Tanggal Mulai Kerja</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {employee.start_date ? format(new Date(employee.start_date), 'd MMMM yyyy', { locale: id }) : '-'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Atasan Langsung / Atas Atasan Langsung</span>
                <span className="font-semibold text-slate-800 block mt-1">
                  {employee.is_superior ? 'Ya' : 'Tidak'}
                </span>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs text-muted-foreground block">Peran Sistem</span>
                <div className="mt-1">
                  <Badge variant={employee.role === 'admin' || employee.role === 'manager' ? 'default' : 'secondary'}>
                    {employee.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs text-muted-foreground block">Tanda Tangan Resmi</span>
                <div className="mt-2">
                  {signatureUrl ? (
                    <div className="h-16 w-36 bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center overflow-hidden" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '6px 6px' }}>
                      <img src={signatureUrl} alt="Tanda Tangan" className="max-h-full max-w-full object-contain drop-shadow-sm" />
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 italic font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Belum mengunggah tanda tangan. Silakan hubungi admin.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Account Security Settings */}
            <div className="pt-6 border-t border-slate-100">
              <NipPasswordToggle employee={employee} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {hasPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 text-amber-800 shadow-sm animate-in fade-in duration-500 mb-2">
            <div className="p-2 bg-amber-100 rounded-full shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold">Permintaan Menunggu Proses</h4>
              <p className="text-sm opacity-90 mt-0.5">Anda memiliki satu permintaan yang menunggu persetujuan. Anda tidak dapat mengajukan permintaan baru sampai yang ini diselesaikan, atau Anda dapat menghapusnya sendiri di bawah ini. <strong className="font-semibold block mt-1">Hubungi admin jika tidak direspon dalam 1x24 jam.</strong></p>
            </div>
          </div>
        )}
        <h2 id="recent-requests" className="text-2xl font-bold tracking-tight pt-2">Permintaan Terbaru</h2>

        <div className="flex flex-col gap-3">
          {leaveHistory && leaveHistory.length > 0 ? (
            leaveHistory.map((leave, index) => {
              const isAcc = leave.status === 'acc';
              const isRejected = leave.status === 'ditolak';

              return (
                <div
                  key={leave.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors duration-300 flex flex-col lg:flex-row lg:items-center justify-between p-5 gap-5"
                >
                  {/* Left Column: Icon and Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2 rounded-full mt-0.5 bg-slate-50 text-slate-500 border border-slate-100 shrink-0">
                      {isAcc ? <CheckCircle2 className="w-4 h-4" /> :
                        isRejected ? <AlertCircle className="w-4 h-4" /> :
                          <Clock className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Link href={`/dashboard/requests/${leave.id}`} className="hover:underline text-slate-800">
                          <h4 className="font-semibold text-base leading-none">{leave.category}</h4>
                        </Link>
                        <span className="text-xs text-slate-400 font-normal leading-none self-center">
                          • {formatRelativeTime(leave.created_at)}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                        <DateDetailsModal dates={leave.dates}>
                          <button suppressHydrationWarning className="text-sm text-muted-foreground hover:text-primary transition-colors text-left flex items-start gap-1.5 break-words">
                            <CalendarDays className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {leave.dates && leave.dates.length > 0 ? (
                              leave.dates.length === 1 ? (
                                format(parseDateString(leave.dates[0]), "d MMMM yyyy", { locale: id })
                              ) : (
                                `${format(parseDateString(leave.dates[0]), "d MMM yyyy", { locale: id })} - ${format(parseDateString(leave.dates[leave.dates.length - 1]), "d MMM", { locale: id })} (${leave.dates.length} days)`
                              )
                            ) : (
                              format(new Date(leave.created_at), "d MMMM yyyy", { locale: id })
                            )}
                          </button>
                        </DateDetailsModal>
                        {leave.note && index > 0 && (
                          <>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-none" title={leave.note}>
                              {leave.note}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Detail blocks for newest request (Address and Note) */}
                      {index === 0 && (leave.address || leave.note) && (
                        <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-100 mt-2.5">
                          {leave.note && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-slate-400 font-mono text-[9px] uppercase tracking-wider shrink-0 w-[80px]">Alasan Cuti:</span>
                              <span className="text-slate-650 font-medium" title={leave.note}>{leave.note}</span>
                            </div>
                          )}
                          
                          {/* Address Info */}
                          {leave.address && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-slate-400 font-mono text-[9px] uppercase tracking-wider shrink-0 w-[80px]">Alamat Cuti:</span>
                              <span className="text-slate-655 font-medium" title={leave.address}>{leave.address}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Progress (Only for newest/first request) */}
                  {index === 0 ? (
                    <div className="w-full lg:w-[260px] shrink-0 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-100 lg:px-5 pt-4 lg:pt-0 space-y-3.5">
                      {/* Progress Bar Header */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">Progress Persetujuan</span>
                        <span className={`font-bold ${isRejected ? 'text-red-600' : isAcc ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {isRejected ? 'Ditolak' : isAcc ? '100% (Selesai)' : 
                            ((leave.is_atasan_approved ? 1 : 0) + (leave.is_pejabat_approved ? 1 : 0)) === 1 ? '66% (Disetujui 1/2)' : '33% (Diajukan)'}
                        </span>
                      </div>
                      
                      {/* Progress Bar Track */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isRejected ? 'bg-red-500 w-full' :
                            isAcc ? 'bg-emerald-500 w-full' :
                            ((leave.is_atasan_approved ? 1 : 0) + (leave.is_pejabat_approved ? 1 : 0)) === 1 ? 'bg-amber-400 w-2/3' : 'bg-primary/60 w-1/3'
                          }`}
                        />
                      </div>

                      {/* Signature Indicators */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs pt-0.5">
                        {/* Atasan Indicator */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                          <span className="text-slate-400 font-medium font-mono text-[10px]">Atasan:</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${leave.is_atasan_approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            <span className={`font-semibold ${leave.is_atasan_approved ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {leave.is_atasan_approved ? 'Disetujui' : 'Menunggu'}
                            </span>
                          </div>
                        </div>

                        {/* Pejabat Indicator */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                          <span className="text-slate-400 font-medium font-mono text-[10px]">Pejabat:</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${leave.is_pejabat_approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            <span className={`font-semibold ${leave.is_pejabat_approved ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {leave.is_pejabat_approved ? 'Disetujui' : 'Menunggu'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden lg:block lg:w-[260px] shrink-0" />
                  )}

                  {/* Right Column: Status & Actions */}
                  <div className="flex flex-col items-end gap-1.5 w-full lg:w-auto shrink-0 justify-center border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide
                      ${isAcc ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isRejected ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {leave.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <DownloadPdfButton
                        pdfData={{
                          employeeId: employee.id,
                          status: leave.status,
                          name: employee.name,
                          nip: employee.nip,
                          position: employee.position,
                          unit: employee.unit,
                          phone: employee.phone_number,
                          employeeStartDate: employee.start_date,
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
                      {leave.status === 'pending' && (
                        <CancelLeaveButton leaveId={leave.id} />
                      )}
                    </div>
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
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Anda belum mengajukan permintaan cuti apa pun. Riwayat Anda akan muncul di sini nanti.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/form">Ajukan permintaan pertama Anda</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
