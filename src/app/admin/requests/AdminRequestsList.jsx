'use client'

import { useState, useEffect, Fragment } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RequestActions } from './RequestActions'
import { AdminDeleteRequestButton } from './AdminDeleteRequestButton'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'
import { AlertCircle, FileText, Search, UserCheck, Inbox, ArrowRight, ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { getRequestsSummaryAction, getRequestsForMonthAction } from '@/app/actions/leaveActions'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const SkeletonRow = () => (
  <TableRow className="animate-pulse bg-slate-50/20">
    <TableCell className="pl-6"><div className="h-4 w-24 bg-slate-200 rounded"></div></TableCell>
    <TableCell><div className="h-4 w-16 bg-slate-200 rounded"></div></TableCell>
    <TableCell><div className="h-4 w-28 bg-slate-200 rounded"></div></TableCell>
    <TableCell><div className="h-4 w-10 bg-slate-200 rounded"></div></TableCell>
    <TableCell><div className="h-4 w-8 bg-slate-200 rounded"></div></TableCell>
    <TableCell><div className="h-6 w-20 bg-slate-200 rounded-full"></div></TableCell>
    <TableCell className="pr-6"><div className="h-8 w-16 bg-slate-200 rounded ml-auto"></div></TableCell>
  </TableRow>
)

const SkeletonCard = () => (
  <div className="p-4 space-y-3 animate-pulse">
    <div className="flex justify-between">
      <div className="h-4 w-32 bg-slate-200 rounded"></div>
      <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 bg-slate-100 rounded"></div>
      <div className="h-8 bg-slate-100 rounded"></div>
    </div>
    <div className="pt-3 border-t border-slate-100 flex justify-between">
      <div className="h-6 w-20 bg-slate-200 rounded"></div>
      <div className="h-8 w-24 bg-slate-200 rounded"></div>
    </div>
  </div>
)

export function AdminRequestsList({ currentEmployeeId, currentEmployeeRole }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tab = searchParams.get('tab') || 'mentioned'
  const setTab = (newTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteButtons, setShowDeleteButtons] = useState(false)
  const [showLegend, setShowLegend] = useState(false)

  // Loading/data states
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [groups, setGroups] = useState([])
  const [pendingMentionedCount, setPendingMentionedCount] = useState(0)
  const [pendingOthersActionCount, setPendingOthersActionCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [requestsByMonth, setRequestsByMonth] = useState({})
  const [expandedMonths, setExpandedMonths] = useState({})
  const [loadingMonths, setLoadingMonths] = useState({})

  // Debounced/Triggered fetch for summary
  useEffect(() => {
    let active = true
    async function loadSummary() {
      setLoadingSummary(true)
      try {
        const res = await getRequestsSummaryAction({ tab, searchQuery, currentEmployeeId })
        if (!active) return

        setGroups(res.groups || [])
        setPendingMentionedCount(res.pendingMentionedCount || 0)
        setPendingOthersActionCount(res.pendingOthersActionCount || 0)
        setTotalCount(res.totalCount || 0)

        // Clear existing monthly caches since context has changed (tab/search)
        setRequestsByMonth({})
        
        // Auto-expand the first month if available
        if (res.groups && res.groups.length > 0) {
          const firstMonth = res.groups[0]
          setExpandedMonths({ [firstMonth.id]: true })
          fetchMonthData(firstMonth.id, firstMonth.ids)
        } else {
          setExpandedMonths({})
        }
      } catch (err) {
        console.error("Failed to load summary", err)
      } finally {
        if (active) setLoadingSummary(false)
      }
    }

    loadSummary()
    return () => {
      active = false
    }
  }, [tab, searchQuery, currentEmployeeId])

  const fetchMonthData = async (monthId, ids) => {
    if (!ids || ids.length === 0) return
    setLoadingMonths(prev => ({ ...prev, [monthId]: true }))
    try {
      const data = await getRequestsForMonthAction({ requestIds: ids })
      setRequestsByMonth(prev => ({ ...prev, [monthId]: data }))
    } catch (err) {
      console.error(`Failed to fetch requests for month ${monthId}:`, err)
    } finally {
      setLoadingMonths(prev => ({ ...prev, [monthId]: false }))
    }
  }

  const toggleExpand = (monthId, ids) => {
    const isExpanded = !expandedMonths[monthId]
    setExpandedMonths(prev => ({ ...prev, [monthId]: isExpanded }))
    
    // Only fetch if we are expanding and do not have data loaded yet
    if (isExpanded && !requestsByMonth[monthId]) {
      fetchMonthData(monthId, ids)
    }
  }

  return (
    <div className="space-y-6">
      {/* Legend / Info Box (Smooth Custom Accordion - Compact & Right-Aligned) */}
      <div className="flex justify-end">
        <div className="w-fit border-0 rounded-2xl overflow-hidden flex flex-col items-end">
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 p-2 cursor-pointer select-none text-left focus:outline-none hover:bg-slate-100 rounded-xl transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-indigo-650" />
            <span className="font-semibold text-xs text-slate-600">Petunjuk Warna Status</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showLegend ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`grid transition-all duration-300 ease-in-out ${showLegend ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
            <div className="overflow-hidden">
              <div className="pt-1.5 pb-2">
                <div className="flex flex-col gap-2 text-[11px] bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 inline-block"></span>
                    <strong className="text-red-650">Merah:</strong> Menunggu tanda tangan Anda.
                  </span>
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 inline-block"></span>
                    <strong className="text-orange-500">Oranye:</strong> Telah Anda tandatangani (Menunggu pejabat lain).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        {/* Tabs */}
        <div className="flex flex-col lg:flex-row -mb-px gap-1 lg:gap-0 w-full lg:w-auto">
          <button 
            type="button"
            onClick={() => setTab('mentioned')}
            className={`py-2.5 lg:py-3.5 px-4 lg:px-5 text-sm font-semibold lg:border-b-2 transition-all duration-200 relative flex items-center gap-2.5 whitespace-nowrap cursor-pointer rounded-lg lg:rounded-none ${
              tab === 'mentioned' 
                ? 'bg-primary/10 lg:bg-transparent text-primary font-bold lg:border-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 lg:hover:bg-transparent lg:hover:border-slate-300'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${tab === 'mentioned' ? 'text-primary' : 'text-slate-400'}`} />
            Ditujukan ke Saya
            {pendingMentionedCount > 0 ? (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingMentionedCount} Pending
              </span>
            ) : pendingOthersActionCount > 0 ? (
              <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingOthersActionCount} Pending
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                0
              </span>
            )}
          </button>
          
          <button 
            type="button"
            onClick={() => setTab('all')}
            className={`py-2.5 lg:py-3.5 px-4 lg:px-5 text-sm font-semibold lg:border-b-2 transition-all duration-200 relative flex items-center gap-2.5 whitespace-nowrap cursor-pointer rounded-lg lg:rounded-none ${
              tab === 'all' 
                ? 'bg-primary/10 lg:bg-transparent text-primary font-bold lg:border-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 lg:hover:bg-transparent lg:hover:border-slate-300'
            }`}
          >
            <Inbox className={`w-4 h-4 ${tab === 'all' ? 'text-primary' : 'text-slate-400'}`} />
            Semua Permintaan
            <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
              {totalCount}
            </span>
          </button>
        </div>

        {/* Quick Search and Mode Hapus Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto mb-3 lg:mb-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 select-none shrink-0">
            <Checkbox 
              id="show-delete" 
              checked={showDeleteButtons} 
              onCheckedChange={(val) => setShowDeleteButtons(!!val)} 
            />
            <label htmlFor="show-delete" className="text-xs font-bold text-slate-600 cursor-pointer">
              Mode Hapus
            </label>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pegawai atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 min-h-[400px] divide-y divide-slate-100">
        {loadingSummary ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Memuat data permintaan...</span>
          </div>
        ) : groups.length > 0 ? (
          groups.map((group) => {
            const isExpanded = !!expandedMonths[group.id]
            const isLoadingData = !!loadingMonths[group.id]
            const requests = requestsByMonth[group.id] || []

            return (
              <div key={group.id} className="flex flex-col">
                {/* Accordion Trigger Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(group.id, group.ids)}
                  className="flex items-center justify-between w-full px-6 py-4 hover:bg-slate-50/80 transition-colors text-left focus:outline-none select-none border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700 text-sm tracking-wide uppercase">
                      {group.label}
                    </span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] font-bold">
                      {group.count} Permintaan
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoadingData && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Accordion Content Container */}
                {isExpanded && (
                  <div className="bg-slate-50/10">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table containerClassName="overflow-x-auto md:overflow-visible">
                        <TableHeader className="bg-slate-50/30">
                          <TableRow>
                            <TableHead className="font-semibold text-slate-700 pl-6">Pegawai</TableHead>
                            <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
                            <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                            <TableHead className="font-semibold text-slate-700">Hari</TableHead>
                            <TableHead className="font-semibold text-slate-700">Lampiran</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right pr-6">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingData ? (
                            <>
                              <SkeletonRow />
                              <SkeletonRow />
                            </>
                          ) : requests.length > 0 ? (
                            requests.map((request) => {
                              const isUserMentioned = request.atasan_id === currentEmployeeId || request.pejabat_id === currentEmployeeId;
                              return (
                                <TableRow 
                                  key={request.id} 
                                  className={`hover:bg-slate-50/60 transition-colors ${
                                    isUserMentioned && request.status === 'pending' && tab === 'all' 
                                      ? 'bg-primary-[5%]/10 border-l-4 border-l-primary' 
                                      : ''
                                  }`}
                                >
                                  <TableCell className="font-medium max-w-[150px] truncate pl-6">
                                    <Link href={`/admin/requests/${request.id}`} className="hover:underline text-primary font-semibold flex items-center gap-1.5 group" title="Lihat Detail">
                                      {request.employee?.name || 'Pegawai Tidak Dikenal'}
                                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-slate-600 font-medium">{request.category}</span>
                                  </TableCell>
                                  <TableCell>
                                    <DateDetailsModal dates={request.dates} />
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-semibold text-slate-700">{request.dates.length} hari</span>
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      const requiresAttachment = ['Besar', 'Melahirkan', 'Penting', 'LuarTanggungan', 'Sakit'].includes(request.category);
                                      if (request.attachment_url) {
                                        return (
                                          <a 
                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/leave_attachments/${request.attachment_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-7.5 h-7.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shadow-xs"
                                            title="Lihat File"
                                          >
                                            <FileText className="w-4 h-4" />
                                          </a>
                                        )
                                      }
                                      
                                      if (requiresAttachment) {
                                        return (
                                          <div className="inline-flex items-center justify-center w-7.5 h-7.5 text-amber-700 bg-amber-50 rounded-lg border border-amber-200 shadow-xs" title="Tanpa Lampiran">
                                            <AlertCircle className="w-4 h-4" />
                                          </div>
                                        )
                                      }
                                      
                                      return <span className="text-xs text-slate-400 font-medium">-</span>;
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={request.status === 'pending' ? 'outline' : 'secondary'}
                                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                        request.status === 'acc' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                        request.status === 'ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}
                                    >
                                      {request.status === 'acc' ? 'DISETUJUI' : request.status === 'ditolak' ? 'DITOLAK' : 'PENDING'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                      {request.status === 'pending' && (
                                        <RequestActions 
                                          request={request} 
                                          currentEmployeeId={currentEmployeeId} 
                                          currentEmployeeRole={currentEmployeeRole}
                                        />
                                      )}
                                      {showDeleteButtons && (request.status === 'ditolak' || request.status === 'acc') && (
                                        <AdminDeleteRequestButton requestId={request.id} />
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center text-slate-400 text-sm">
                                Tidak ada permintaan di bulan ini.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {isLoadingData ? (
                        <>
                          <SkeletonCard />
                          <SkeletonCard />
                        </>
                      ) : requests.length > 0 ? (
                        requests.map((request) => {
                          const isUserMentioned = request.atasan_id === currentEmployeeId || request.pejabat_id === currentEmployeeId;
                          const requiresAttachment = ['Besar', 'Melahirkan', 'Penting', 'LuarTanggungan', 'Sakit'].includes(request.category);
                          return (
                            <div 
                              key={request.id} 
                              className={`p-4 space-y-3 hover:bg-slate-50/60 transition-colors ${
                                isUserMentioned && request.status === 'pending' && tab === 'all' 
                                  ? 'bg-primary-[5%]/10 border-l-4 border-l-primary' 
                                  : ''
                              }`}
                            >
                              {/* Header: Employee Name & Status */}
                              <div className="flex items-start justify-between gap-3">
                                <Link 
                                  href={`/admin/requests/${request.id}`} 
                                  className="hover:underline text-primary font-bold flex items-center gap-1 group text-sm" 
                                  title="Lihat Detail"
                                >
                                  {request.employee?.name || 'Pegawai Tidak Dikenal'}
                                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                                </Link>
                                
                                <Badge 
                                  variant={request.status === 'pending' ? 'outline' : 'secondary'}
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                                    request.status === 'acc' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    request.status === 'ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {request.status === 'acc' ? 'DISETUJUI' : request.status === 'ditolak' ? 'DITOLAK' : 'PENDING'}
                                </Badge>
                              </div>

                              {/* Details */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Kategori</span>
                                  <span>{request.category}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Durasi</span>
                                  <span className="font-semibold text-slate-700">{request.dates.length} hari</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Tanggal</span>
                                  <DateDetailsModal dates={request.dates} />
                                </div>
                              </div>

                              {/* Attachment & Actions */}
                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  {request.attachment_url ? (
                                    <a 
                                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/leave_attachments/${request.attachment_url}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-blue-650 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition-colors font-semibold"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Lampiran
                                    </a>
                                  ) : requiresAttachment ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-semibold" title="Tanpa Lampiran">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      Butuh Lampiran
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-medium">Tanpa Lampiran</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {request.status === 'pending' && (
                                    <RequestActions 
                                      request={request} 
                                      currentEmployeeId={currentEmployeeId} 
                                      currentEmployeeRole={currentEmployeeRole}
                                    />
                                  )}
                                  {showDeleteButtons && (request.status === 'ditolak' || request.status === 'acc') && (
                                    <AdminDeleteRequestButton requestId={request.id} />
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-6 text-center text-slate-400 text-sm">
                          Tidak ada permintaan di bulan ini.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 p-12 text-center bg-slate-50/20">
            <div className="p-4 bg-slate-100 text-slate-400 rounded-full">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="max-w-xs">
              <h3 className="font-semibold text-slate-800">
                {searchQuery ? 'Hasil Tidak Ditemukan' : 'Tidak Ada Permintaan Cuti'}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {searchQuery 
                  ? `Tidak menemukan hasil pencarian untuk "${searchQuery}". Silakan coba kata kunci lain.` 
                  : tab === 'mentioned'
                    ? 'Bagus! Tidak ada permintaan cuti ditujukan ke Anda saat ini.' 
                    : 'Belum ada pengajuan cuti pegawai yang masuk dalam database.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

