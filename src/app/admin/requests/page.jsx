import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RequestActions } from './RequestActions'
import { AdminDeleteRequestButton } from './AdminDeleteRequestButton'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'
import { AlertCircle, FileText, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') redirect('/dashboard')

  // Fetch all pending requests with user information (joining profiles)
  const { data: requests, error } = await supabase
    .from('cuti')
    .select(`
      *,
      employee:employees!employee_id (
        name
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permintaan Cuti</h1>
          <p className="text-muted-foreground">
            Tinjau dan kelola semua pengajuan cuti pegawai.
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pegawai</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Hari</TableHead>
              <TableHead>Lampiran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests && requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    <Link href={`/admin/requests/${request.id}`} className="hover:underline text-primary" title="Lihat Detail">
                      {request.employee?.name || 'Pegawai Tidak Dikenal'}
                    </Link>
                  </TableCell>
                  <TableCell>{request.category}</TableCell>
                  <TableCell>
                    <DateDetailsModal dates={request.dates} />
                  </TableCell>
                  <TableCell>{request.dates.length}</TableCell>
                  <TableCell>
                    {(() => {
                      const requiresAttachment = ['Besar', 'Melahirkan', 'Penting', 'LuarTanggungan', 'Sakit'].includes(request.category);
                      if (request.attachment_url) {
                        return (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/leave_attachments/${request.attachment_url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 text-blue-600 hover:text-blue-800 bg-blue-50 rounded-md border border-blue-200 transition-colors"
                            title="Lihat File"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )
                      }
                      
                      if (requiresAttachment) {
                        return (
                          <div className="inline-flex items-center justify-center w-7 h-7 text-amber-700 bg-amber-50 rounded-md border border-amber-200" title="Tanpa Lampiran">
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
                      className={
                        request.status === 'acc' ? 'bg-green-100 text-green-700 border-green-200' : 
                        request.status === 'ditolak' ? 'bg-red-100 text-red-700 border-red-200' : 
                        ''
                      }
                    >
                      {request.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'pending' && (
                        <RequestActions requestId={request.id} />
                      )}
                      {request.status === 'ditolak' && (
                        <AdminDeleteRequestButton requestId={request.id} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada permintaan cuti ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
