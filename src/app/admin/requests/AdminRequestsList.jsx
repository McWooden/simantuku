'use client'

import { useState } from 'react'
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
import { AlertCircle, FileText, Search, UserCheck, Inbox, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function AdminRequestsList({ initialRequests = [], currentEmployeeId }) {
  const [tab, setTab] = useState('mentioned') // 'mentioned' or 'all'
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate counts for badges
  const pendingMentionedCount = initialRequests.filter(r => 
    (r.atasan_id === currentEmployeeId || r.pejabat_id === currentEmployeeId) && 
    r.status === 'pending'
  ).length

  const pendingAllCount = initialRequests.filter(r => r.status === 'pending').length

  // Filter requests based on selected tab
  const tabFilteredRequests = initialRequests.filter(r => {
    if (tab === 'mentioned') {
      return r.atasan_id === currentEmployeeId || r.pejabat_id === currentEmployeeId
    }
    return true
  })

  // Further filter based on search query
  const finalRequests = tabFilteredRequests.filter(r => {
    if (!searchQuery.trim()) return true
    
    const employeeName = (r.employee?.name || '').toLowerCase()
    const category = (r.category || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    
    return employeeName.includes(query) || category.includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Navigation Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        {/* Tabs */}
        <div className="flex -mb-px overflow-x-auto scrollbar-none">
          <button 
            type="button"
            onClick={() => setTab('mentioned')}
            className={`py-3.5 px-5 text-sm font-semibold border-b-2 transition-all duration-200 relative flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              tab === 'mentioned' 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${tab === 'mentioned' ? 'text-primary' : 'text-slate-400'}`} />
            Ditujukan ke Saya
            {pendingMentionedCount > 0 ? (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingMentionedCount} Pending
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
            className={`py-3.5 px-5 text-sm font-semibold border-b-2 transition-all duration-200 relative flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
              tab === 'all' 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Inbox className={`w-4 h-4 ${tab === 'all' ? 'text-primary' : 'text-slate-400'}`} />
            Semua Permintaan
            {pendingAllCount > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingAllCount} Pending
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                {initialRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80 mb-3 md:mb-0">
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

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Pegawai</TableHead>
              <TableHead className="font-semibold text-slate-700">Kategori</TableHead>
              <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
              <TableHead className="font-semibold text-slate-700">Hari</TableHead>
              <TableHead className="font-semibold text-slate-700">Lampiran</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalRequests.length > 0 ? (
              finalRequests.map((request) => {
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
                          />
                        )}
                        {request.status === 'ditolak' && (
                          <AdminDeleteRequestButton requestId={request.id} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center bg-slate-50/20">
                  <div className="flex flex-col items-center justify-center space-y-3 p-6">
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
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
