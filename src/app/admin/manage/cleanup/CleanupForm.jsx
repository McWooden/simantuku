'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkDeleteRejectedRequestsAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, Trash2, Loader2, Info } from 'lucide-react'

export default function CleanupForm({ rejectedCount }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const challengePhrase = "HAPUS SEMUA DATA DITOLAK"
  const isMatch = confirmText === challengePhrase

  const handleBulkDelete = async () => {
    if (!isMatch) return
    
    setLoading(true)
    const res = await bulkDeleteRejectedRequestsAction()
    
    if (res?.error) {
      alert(`Gagal menghapus: ${res.error}`)
    } else {
      alert(`Berhasil menghapus ${res.count} permintaan cuti yang ditolak beserta lampirannya.`)
      setConfirmText('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card className="border-red-200 shadow-sm overflow-hidden">
      <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-semibold text-red-900">Zona Berbahaya (Pembersihan Data)</h2>
          <p className="text-sm text-red-700/90 mt-1">
            Tindakan di halaman ini bersifat permanen dan tidak dapat dibatalkan. Data yang dihapus akan hilang dari sistem selamanya.
          </p>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Hapus Semua Permintaan Ditolak
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Sistem menemukan <strong className="text-slate-800 font-bold">{rejectedCount}</strong> permintaan cuti yang berstatus ditolak. 
              Menghapus data ini juga akan secara otomatis menghapus file lampirannya dari Storage untuk menghemat ruang.
            </p>
          </div>

          {rejectedCount > 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3 text-sm text-slate-700">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Untuk mencegah penghapusan yang tidak disengaja, ketik persis kalimat 
                  <strong className="mx-1 text-slate-900 select-all bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                    {challengePhrase}
                  </strong> 
                  di bawah ini untuk mengonfirmasi.
                </p>
              </div>
              
              <Input 
                type="text"
                placeholder="Ketik kalimat konfirmasi di sini..."
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={`font-mono text-sm ${isMatch ? 'border-green-500 focus-visible:ring-green-500' : 'border-slate-300 focus-visible:ring-slate-400'}`}
                autoComplete="off"
              />
              
              <Button 
                onClick={handleBulkDelete} 
                disabled={!isMatch || loading}
                variant="destructive"
                className="w-full sm:w-auto mt-2 transition-all shadow-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang Menghapus...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Hapus {rejectedCount} Permintaan Permanen</>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="font-semibold text-green-900">Tidak ada data untuk dihapus</p>
              <p className="text-sm text-green-700/80 mt-1">Storage dan antrean Anda saat ini sudah bersih dari permohonan yang ditolak.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
