'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

export default function SignatureForm({ employees }) {
  const [selectedUser, setSelectedUser] = useState('')

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.name}${emp.nip ? ` (NIP: ${emp.nip})` : ''}`
  }))
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: '' }

  const supabase = createClient()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'image/png') {
        setStatus({ type: 'error', message: 'Harap unggah file PNG (transparan).' })
        setFile(null)
        setPreviewUrl(null)
        e.target.value = '' // reset input
        return
      }
      if (selectedFile.size > 2 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'Ukuran file maksimal 2MB.' })
        setFile(null)
        setPreviewUrl(null)
        e.target.value = '' // reset input
        return
      }
    }
    setFile(selectedFile)
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    } else {
      setPreviewUrl(null)
    }
    setStatus(null)
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!selectedUser) {
      setStatus({ type: 'error', message: 'Silakan pilih pegawai terlebih dahulu.' })
      return
    }
    if (!file) {
      setStatus({ type: 'error', message: 'Silakan pilih file tanda tangan (PNG).' })
      return
    }

    try {
      setUploading(true)
      setStatus(null)

      const selectedEmployee = employees.find(emp => emp.id === selectedUser)
      const employeeName = selectedEmployee ? selectedEmployee.name : ''

      // The path convention: userId/signature.png
      const filePath = `${selectedUser}/signature.png`

      // Upload the file to Supabase storage bucket 'signatures'
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, { 
          upsert: true, // replace if exists
          contentType: 'image/png' 
        })

      if (uploadError) {
        throw uploadError
      }

      setStatus({ type: 'success', message: `Tanda tangan ${employeeName} berhasil diunggah!` })
      setFile(null)
      setPreviewUrl(null)
      setSelectedUser('')
      document.getElementById('signature-file').value = '' // reset file input

    } catch (error) {
      setStatus({ type: 'error', message: `Gagal mengunggah: ${error.message}` })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleUpload} className="space-y-6">
        {status && (
          <div className={`p-4 rounded-md flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
            {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="employee-select">Pilih Pegawai</Label>
          <SearchableSelect
            value={selectedUser}
            onChange={setSelectedUser}
            options={employeeOptions}
            placeholder="Pilih pegawai..."
            searchPlaceholder="Cari pegawai..."
          />
        </div>

      <div className="space-y-2">
        <Label htmlFor="signature-file">File Tanda Tangan (Hanya PNG)</Label>
        <Input 
          id="signature-file" 
          type="file" 
          accept="image/png" 
          onChange={handleFileChange}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">
          Gunakan gambar PNG dengan background transparan (Maksimal 2MB) agar terlihat rapi pada PDF.
        </p>
        {previewUrl && (
          <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 relative">
            <p className="text-[10px] text-slate-400 mb-4 font-bold uppercase tracking-widest">Pratinjau Tanda Tangan</p>
            <div className="bg-white px-8 py-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-center relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
              <img src={previewUrl} alt="Signature Preview" className="max-h-24 object-contain relative z-10 drop-shadow-sm" />
            </div>
          </div>
        )}
      </div>

        <Button type="submit" disabled={uploading || !selectedUser || !file} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Unggah Tanda Tangan
            </>
          )}
        </Button>
      </form>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-sm space-y-3">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Info className="w-4 h-4 text-primary" />
          <h3>Cara Membuat Tanda Tangan Transparan</h3>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-slate-600 ml-1">
          <li>Tulis tanda tangan Anda di atas kertas putih bersih.</li>
          <li>Foto tanda tangan tersebut dengan pencahayaan yang terang.</li>
          <li>Crop (potong) foto tersebut agar hanya fokus pada tanda tangan.</li>
          <li>
            Ubah foto JPG tersebut menjadi PNG transparan melalui web ini:{' '}
            <a 
              href="https://smallpngtools.com/convert-jpg-signature-to-png.php" 
              target="_blank" 
              rel="noreferrer"
              className="text-primary hover:underline break-all"
            >
              smallpngtools.com/convert-jpg-signature-to-png.php
            </a>
          </li>
          <li>Unduh hasil PNG-nya dan unggah di form ini!</li>
        </ol>
      </div>
    </div>
  )
}
