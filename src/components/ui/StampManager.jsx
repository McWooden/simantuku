'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Trash2, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

const UNITS = [
  "Kecamatan Magelang Utara",
  "Kelurahan Kedungsari",
  "Kelurahan Kramat Selatan",
  "Kelurahan Kramat Utara",
  "Kelurahan Potrobangsan",
  "Kelurahan Wates"
]

export default function StampManager() {
  const [stamps, setStamps] = useState({}) // format: { [unitName]: { url: '...', size: 123 } }
  const [loading, setLoading] = useState(true)
  const [uploadingUnit, setUploadingUnit] = useState(null)
  const [deletingUnit, setDeletingUnit] = useState(null)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: '' }

  const supabase = createClient()

  const fetchStamps = async () => {
    setLoading(true)
    try {
      // List all files in the 'stamps' folder of the signatures bucket
      const { data: files, error } = await supabase.storage
        .from('signatures')
        .list('stamps', { limit: 100 })

      if (error) {
        // If stamps folder is not created, list might fail or return empty. We ignore if folder empty
        if (error.message !== 'Object not found') throw error
      }

      const stampMap = {}
      if (files && files.length > 0) {
        const promises = files.map(async (file) => {
          if (file.name === '.emptyFolderPlaceholder') return
          
          // File name is unit.png (e.g. Kelurahan Kedungsari.png)
          const unitName = file.name.replace('.png', '')
          if (UNITS.includes(unitName)) {
            const { data } = await supabase.storage
              .from('signatures')
              .createSignedUrl(`stamps/${file.name}`, 3600)
            
            stampMap[unitName] = {
              url: data?.signedUrl || null,
              size: file.metadata?.size || 0
            }
          }
        })
        await Promise.all(promises)
      }
      setStamps(stampMap)
    } catch (err) {
      console.error('Error fetching stamps:', err)
      setStatus({ type: 'error', message: `Gagal memuat stempel: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStamps()
  }, [])

  const handleUpload = async (unitName, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'image/png') {
      setStatus({ type: 'error', message: 'Harap unggah file PNG (transparan).' })
      e.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Ukuran stempel maksimal 2MB.' })
      e.target.value = ''
      return
    }

    setUploadingUnit(unitName)
    setStatus(null)

    try {
      const filePath = `stamps/${unitName}.png`
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'image/png'
        })

      if (uploadError) throw uploadError

      setStatus({ type: 'success', message: `Stempel ${unitName} berhasil diunggah!` })
      await fetchStamps()
    } catch (err) {
      console.error('Upload error:', err)
      setStatus({ type: 'error', message: `Gagal mengunggah stempel: ${err.message}` })
    } finally {
      setUploadingUnit(null)
      e.target.value = ''
    }
  }

  const handleDelete = async (unitName) => {
    if (!confirm(`Anda yakin ingin menghapus stempel untuk ${unitName}?`)) return

    setDeletingUnit(unitName)
    setStatus(null)

    try {
      const filePath = `stamps/${unitName}.png`
      const { error } = await supabase.storage
        .from('signatures')
        .remove([filePath])

      if (error) throw error

      setStatus({ type: 'success', message: `Stempel ${unitName} berhasil dihapus.` })
      await fetchStamps()
    } catch (err) {
      console.error('Delete error:', err)
      setStatus({ type: 'error', message: `Gagal menghapus stempel: ${err.message}` })
    } finally {
      setDeletingUnit(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Manajemen Stempel Unit Kerja</h2>
        <p className="text-xs text-muted-foreground">Kelola stempel resmi untuk masing-masing unit kerja (Kecamatan/Kelurahan).</p>
      </div>

      {status && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white border rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <p className="text-sm">Memuat stempel unit...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {UNITS.map((unit) => {
            const stamp = stamps[unit]
            const isUploading = uploadingUnit === unit
            const isDeleting = deletingUnit === unit

            return (
              <div key={unit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{unit}</h3>
                    {stamp ? (
                      <p className="text-xs text-slate-500 mt-1">Ukuran: {(stamp.size / 1024).toFixed(1)} KB</p>
                    ) : (
                      <p className="text-xs text-amber-600 font-medium mt-1">Belum ada stempel resmi</p>
                    )}
                  </div>
                  
                  {stamp?.url && (
                    <div className="h-16 w-24 bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '6px 6px' }}>
                      <img src={stamp.url} alt={`Stempel ${unit}`} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  {stamp ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 ml-auto h-9"
                      onClick={() => handleDelete(unit)}
                      disabled={isDeleting || isUploading}
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                      Hapus Stempel
                    </Button>
                  ) : (
                    <div className="relative w-full">
                      <input
                        type="file"
                        accept="image/png"
                        onChange={(e) => handleUpload(unit, e)}
                        disabled={isUploading || isDeleting}
                        id={`file-input-${unit}`}
                        className="hidden"
                      />
                      <Label
                        htmlFor={`file-input-${unit}`}
                        className="flex items-center justify-center gap-2 w-full h-9 border border-slate-200 hover:border-slate-350 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50/50 hover:bg-slate-55 transition-colors"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> Mengunggah...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-slate-500" /> Unggah Stempel (PNG)
                          </>
                        )}
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
