import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { 
  ArrowLeft, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XOctagon, 
  Database, 
  Globe, 
  ShieldCheck, 
  RefreshCw,
  HardDrive
} from 'lucide-react'

// Helper function to check if Supabase error points to hibernation/offline
function isSupabaseOfflineError(error) {
  if (!error) return false
  const msg = typeof error === 'string' ? error.toLowerCase() : (error.message || '').toLowerCase()
  const status = error.status || error.code
  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('service unavailable') ||
    msg.includes('bad gateway') ||
    msg.includes('paused') ||
    msg.includes('connection') ||
    msg.includes('network') ||
    msg.includes('timeout')
  )
}

// Disable Next.js route caching to always get fresh status
export const revalidate = 0

export const metadata = {
  title: "Status Server - Sicerdas",
  description: "Monitor status keaktifan database dan server Sicerdas selama 30 hari terakhir.",
}

export default async function ServerStatusPage() {
  let isOffline = false
  let currentStatus = 'operational'
  let logs = []

  try {
    const supabase = await createClient()

    // 1. Fetch current status config
    const { data: configData, error: configError } = await supabase
      .from('server_config')
      .select('value')
      .eq('key', 'current_status')
      .single()

    // 2. Fetch status logs of the past 30 days
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
    const { data: logsData, error: logsError } = await supabase
      .from('server_status_logs')
      .select('checked_at, status')
      .gte('checked_at', thirtyDaysAgo)
      .order('checked_at', { ascending: true })

    if (configError) {
      if (isSupabaseOfflineError(configError)) {
        isOffline = true
        currentStatus = 'offline'
      } else {
        console.error("Config fetch error:", configError)
      }
    } else {
      currentStatus = configData?.value || 'operational'
    }

    if (logsError) {
      if (isSupabaseOfflineError(logsError)) {
        isOffline = true
      } else {
        console.error("Logs fetch error:", logsError)
      }
    } else {
      logs = logsData || []
    }
  } catch (err) {
    console.error("Database connection exception:", err)
    isOffline = true
    currentStatus = 'offline'
  }

  // Generate date array for the past 30 days (excluding today, up to today)
  const past30Days = []
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i)
    d.setHours(0, 0, 0, 0)
    past30Days.push(d)
  }

  // Map each day to its computed status
  const timeline = past30Days.map((date) => {
    const isToday = date.toDateString() === new Date().toDateString()
    
    if (isOffline) {
      return {
        date,
        status: 'offline',
        label: 'Offline (Database Hibernasi)',
        colorClass: 'bg-slate-300 hover:bg-slate-400'
      }
    }

    // Filter logs for this specific calendar day
    const dayLogs = logs.filter((log) => {
      const logDate = new Date(log.checked_at)
      return logDate.toDateString() === date.toDateString()
    })

    let dayStatus = 'operational'
    let label = 'Beroperasi dengan Baik'
    let colorClass = 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]'

    if (dayLogs.length === 0) {
      // If no logs, but it's today and currentStatus is online, we assume it's operational
      if (isToday && currentStatus !== 'offline') {
        dayStatus = currentStatus
        if (currentStatus === 'maintenance') {
          label = 'Pemeliharaan Terjadwal'
          colorClass = 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
        } else if (currentStatus === 'degraded') {
          label = 'Pemeliharaan Serius (Kinerja Turun)'
          colorClass = 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
        }
      } else {
        // No logs for a past day means database was hibernating/unreachable
        dayStatus = 'offline'
        label = 'Offline (Server Hibernasi / Mati)'
        colorClass = 'bg-slate-300 hover:bg-slate-400'
      }
    } else {
      // Aggregate statuses logged today
      const hasDegraded = dayLogs.some((l) => l.status === 'degraded')
      const hasMaintenance = dayLogs.some((l) => l.status === 'maintenance')

      if (hasDegraded) {
        dayStatus = 'degraded'
        label = 'Pemeliharaan Serius (Kinerja Turun)'
        colorClass = 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
      } else if (hasMaintenance) {
        dayStatus = 'maintenance'
        label = 'Pemeliharaan Terjadwal'
        colorClass = 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
      }
    }

    return {
      date,
      status: dayStatus,
      label,
      colorClass
    }
  })

  // Calculate Uptime percentage (excluding days marked offline)
  const onlineDaysCount = timeline.filter(t => t.status !== 'offline').length
  const uptimePercentage = ((onlineDaysCount / 30) * 100).toFixed(1)

  // Status header information
  let statusTitle = "Semua Sistem Beroperasi dengan Baik"
  let statusDesc = "Seluruh layanan web dan database berjalan normal tanpa kendala."
  let statusIcon = <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-pulse" />
  let headerBg = "bg-emerald-50 border-emerald-100 text-emerald-900"
  let pulseColor = "bg-emerald-500"

  if (currentStatus === 'maintenance') {
    statusTitle = "Sistem dalam Pemeliharaan Ringan"
    statusDesc = "Beberapa layanan sedang dalam pemeliharaan rutin. Pengajuan cuti mungkin sedikit lambat."
    statusIcon = <AlertTriangle className="w-8 h-8 text-amber-600 animate-bounce" />
    headerBg = "bg-amber-50 border-amber-100 text-amber-900"
    pulseColor = "bg-amber-500"
  } else if (currentStatus === 'degraded') {
    statusTitle = "Sistem Mengalami Pemeliharaan Serius"
    statusDesc = "Server sedang mengalami penyesuaian infrastruktur berat. Beberapa fitur dinonaktifkan sementara."
    statusIcon = <XOctagon className="w-8 h-8 text-rose-600 animate-spin" style={{ animationDuration: '4s' }} />
    headerBg = "bg-rose-50 border-rose-100 text-rose-900"
    pulseColor = "bg-rose-500"
  } else if (isOffline || currentStatus === 'offline') {
    statusTitle = "Server Database Sedang Offline / Hibernasi"
    statusDesc = "Database Supabase tertidur otomatis karena tidak diakses selama lebih dari 7 hari. Coba lakukan login untuk membangunkan kembali server, atau hubungi Administrator."
    statusIcon = <XOctagon className="w-8 h-8 text-slate-500" />
    headerBg = "bg-slate-100 border-slate-200 text-slate-800"
    pulseColor = "bg-slate-400"
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-bold text-slate-700">Monitor Layanan</span>
          </div>
        </div>

        {/* Main Status Panel */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-md flex items-start gap-5 transition-all duration-300 ${headerBg}`}>
          <div className="p-3 bg-white rounded-2xl shadow-sm flex-shrink-0">
            {statusIcon}
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{statusTitle}</h1>
              <span className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${pulseColor}`}></span>
              </span>
            </div>
            <p className="text-sm opacity-90 leading-relaxed max-w-2xl">{statusDesc}</p>
          </div>
        </div>

        {/* 30-Day Activity Panel */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Uptime 30 Hari Terakhir</h2>
              <p className="text-xs text-slate-500">Dicatat otomatis menggunakan pg_cron database heartbeat.</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-primary tracking-tight">{uptimePercentage}%</span>
              <span className="text-xs text-slate-400 block font-semibold">Rata-rata Keaktifan</span>
            </div>
          </div>

          {/* Grid Blocks */}
          <div className="space-y-4">
            <div className="grid grid-cols-10 sm:grid-cols-15 gap-2 sm:gap-2.5">
              {timeline.map((day, idx) => (
                <div
                  key={idx}
                  className={`h-9 rounded-lg transition-all duration-200 cursor-help relative group ${day.colorClass}`}
                  title={`${format(day.date, 'd MMMM yyyy', { locale: localeID })}: ${day.label}`}
                >
                  {/* Styled CSS Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-50 text-center leading-normal">
                    <span className="block text-slate-300 text-[10px] font-normal">
                      {format(day.date, 'EEEE, d MMM yyyy', { locale: localeID })}
                    </span>
                    {day.label}
                    <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider pt-2">
              <span>30 hari yang lalu</span>
              <div className="h-px bg-slate-200 flex-1 mx-4"></div>
              <span>Hari ini</span>
            </div>
          </div>

          {/* Legend indicator */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-slate-100 justify-center text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span>Beroperasi Baik (Hijau)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500"></span>
              <span>Pemeliharaan Ringan (Kuning)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-500"></span>
              <span>Pemeliharaan Serius (Merah)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-300"></span>
              <span>Offline / Hibernasi (Abu-abu)</span>
            </div>
          </div>
        </div>

        {/* Detailed Service Status */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Rincian Komponen Layanan</h3>
            <p className="text-xs text-slate-500">Pemantauan real-time status masing-masing komponen internal.</p>
          </div>
          <div className="divide-y divide-slate-100">
            <ServiceRow 
              icon={<Globe className="w-5 h-5 text-indigo-500" />}
              name="Web Application Server"
              description="Next.js App Server running on host node"
              status="operational"
            />
            <ServiceRow 
              icon={<Database className="w-5 h-5 text-sky-500" />}
              name="Supabase PostgreSQL Database"
              description="Relational database hosting employees & leave transactions"
              status={isOffline ? 'offline' : currentStatus}
            />
            <ServiceRow 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
              name="Supabase Auth (GoTrue)"
              description="Handles authentication services & OAuth providers"
              status={isOffline ? 'offline' : currentStatus}
            />
            <ServiceRow 
              icon={<HardDrive className="w-5 h-5 text-purple-500" />}
              name="Supabase Storage Bucket"
              description="Holds official attachment files and signs"
              status={isOffline ? 'offline' : currentStatus}
            />
          </div>
        </div>

        {/* Administration Actions (Optional documentation) */}
        {(isOffline || currentStatus !== 'operational') && (
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-3xl text-xs text-blue-800 leading-relaxed shadow-sm space-y-2">
            <h4 className="font-extrabold uppercase tracking-wider text-blue-900">Catatan Pemulihan Server (Untuk Admin)</h4>
            <p>
              Supabase secara otomatis menidurkan (hibernate) database pada paket gratis jika tidak memiliki traffic selama 7 hari berturut-turut.
              Untuk memulihkan, silakan masuk ke <strong>Supabase Dashboard</strong> proyek ini, lalu klik tombol <strong>&quot;Restore Project&quot;</strong>. 
              Sistem akan aktif kembali dalam 1-3 menit.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function ServiceRow({ icon, name, description, status }) {
  let statusBadge = (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wide">
      Operational
    </span>
  )

  if (status === 'maintenance') {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wide">
        Maintenance
      </span>
    )
  } else if (status === 'degraded') {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 uppercase tracking-wide">
        Degraded
      </span>
    )
  } else if (status === 'offline') {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wide">
        Offline
      </span>
    )
  }

  return (
    <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div>
        {statusBadge}
      </div>
    </div>
  )
}
