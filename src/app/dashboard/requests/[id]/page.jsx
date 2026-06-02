import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, MapPin, User, FileSignature, CheckCircle, XCircle } from 'lucide-react'
import { PdfPreviewEmbed } from '@/components/ui/PdfPreviewEmbed'

export default async function UserRequestDetailPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!employee) redirect('/login')

  // Fetch request details with employee and superiors
  const { data: request, error } = await supabase
    .from('cuti')
    .select(`
      *,
      employee:employees!employee_id (
        id, name, nip, unit, position, phone_number, start_date
      ),
      atasan:employees!atasan_id (
        name, position
      ),
      pejabat:employees!pejabat_id (
        name, position
      )
    `)
    .eq('id', id)
    .single()

  if (error || !request || request.employee_id !== employee.id) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Permintaan Tidak Ditemukan</h1>
        <p className="mt-2 text-slate-500">Data cuti mungkin telah dihapus, ID tidak valid, atau Anda tidak memiliki akses.</p>
        <Link href="/dashboard">
          <Button className="mt-4">Kembali ke Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Detail Permintaan Cuti</h1>
          <p className="text-slate-500 text-sm">Menampilkan informasi lengkap untuk pengajuan cuti ini.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Kategori Cuti</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{request.category}</p>
                </div>
                <Badge 
                  variant={request.status === 'pending' ? 'outline' : 'secondary'}
                  className={`px-3 py-1 text-sm ${
                    request.status === 'acc' ? 'bg-green-100 text-green-700 border-green-200' : 
                    request.status === 'ditolak' ? 'bg-red-100 text-red-700 border-red-200' : 
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {request.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Tanggal Cuti ({request.dates.length} Hari)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.dates.map((d, i) => (
                        <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-medium">
                          {new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <FileText className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Alasan / Catatan</p>
                    <p className="mt-1 text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                      {request.note || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Alamat Selama Menjalankan Cuti</p>
                    <p className="mt-1 text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                      {request.address || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <FileSignature className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Pejabat Terkait</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-sky-50/50 p-3 rounded-md border border-sky-100">
                        <p className="text-xs font-medium text-sky-700 mb-1">Atasan Langsung</p>
                        <p className="text-sm font-bold text-slate-800">{request.atasan?.name}</p>
                        <p className="text-xs text-slate-500">{request.atasan?.position}</p>
                      </div>
                      <div className="bg-sky-50/50 p-3 rounded-md border border-sky-100">
                        <p className="text-xs font-medium text-sky-700 mb-1">Pejabat Berwenang ({request.recipient_type})</p>
                        <p className="text-sm font-bold text-slate-800">{request.pejabat?.name}</p>
                        <p className="text-xs text-slate-500">{request.pejabat?.position}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 leading-tight">{request.employee?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">NIP. {request.employee?.nip || '-'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">Unit Kerja</p>
                  <p className="text-sm text-slate-800 font-medium">{request.employee?.unit || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Jabatan</p>
                  <p className="text-sm text-slate-800 font-medium">{request.employee?.position || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Tgl Pengajuan</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {new Date(request.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-blue-500" /> Dokumen Pendukung
              </p>
              {request.attachment_url ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Lampiran Tersedia</p>
                      <p className="text-xs text-blue-700/80 mt-0.5">Surat pendukung untuk cuti ini telah diunggah.</p>
                    </div>
                  </div>
                  <a 
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/leave_attachments/${request.attachment_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-sm font-medium text-slate-700 py-2.5 rounded-md transition-colors"
                  >
                    Buka Dokumen PDF
                  </a>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <XCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Tidak ada lampiran</p>
                  <p className="text-xs text-slate-500 mt-1">Cuti ini diajukan tanpa dokumen pendukung.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" /> Pratinjau Surat Cuti
        </h2>
        <PdfPreviewEmbed request={request} />
      </div>
    </div>
  )
}
