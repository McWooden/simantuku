'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Download, Trash2, FolderArchive, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function AttachmentsManagerPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mappings, setMappings] = useState({})
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const supabase = createClient()
  const categories = ['Besar', 'Melahirkan', 'Penting', 'LuarTanggungan', 'Sakit']
  const bucketName = 'leave_attachments'

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      let allFiles = []

      for (const category of categories) {
        const { data, error: listError } = await supabase.storage
          .from(bucketName)
          .list(category, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          })

        if (listError) {
          console.error(`Error fetching category ${category}:`, listError)
          continue
        }

        // Filter out the placeholder/empty directory marker if present (often .emptyFolderPlaceholder)
        const validFiles = data
          .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
          .map(f => ({
            ...f,
            category,
            fullPath: `${category}/${f.name}`
          }))
        
        allFiles = [...allFiles, ...validFiles]
      }

      setFiles(allFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))

      // Fetch mappings from DB to see which request owns the file
      const { data: cutiRequests, error: cutiError } = await supabase
        .from('cuti')
        .select('id, attachment_url')
        .not('attachment_url', 'is', null)
      
      const newMappings = {}
      if (cutiRequests && !cutiError) {
        cutiRequests.forEach(req => {
          newMappings[req.attachment_url] = req.id
        })
      }
      setMappings(newMappings)

    } catch (err) {
      console.error(err)
      setError('Gagal memuat daftar lampiran.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleDelete = async (fullPath) => {
    if (!confirm('Anda yakin ingin menghapus file ini permanen dari storage? Tindakan ini tidak dapat dibatalkan.')) return
    
    setDeletingId(fullPath)
    try {
      const { error: delError } = await supabase.storage
        .from(bucketName)
        .remove([fullPath])

      if (delError) throw delError

      setFiles(prev => prev.filter(f => f.fullPath !== fullPath))
    } catch (err) {
      console.error(err)
      alert(`Gagal menghapus file: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownloadSingle = async (fullPath, fileName) => {
    try {
      const { data, error: downError } = await supabase.storage
        .from(bucketName)
        .download(fullPath)
      
      if (downError) throw downError

      saveAs(data, fileName)
    } catch (err) {
      console.error(err)
      alert(`Gagal mengunduh file: ${err.message}`)
    }
  }

  const handleDownloadBulk = async () => {
    if (files.length === 0) return
    setDownloadingZip(true)
    
    try {
      const zip = new JSZip()
      
      // Download all files concurrently
      const downloadPromises = files.map(async (file) => {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(file.fullPath)
        
        if (error) {
          console.error(`Failed to download ${file.fullPath}`, error)
          return null
        }
        
        // Add to zip, organized by category folders
        zip.folder(file.category).file(file.name, data)
        return true
      })

      await Promise.all(downloadPromises)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, `Lampiran_Cuti_${new Date().toISOString().split('T')[0]}.zip`)

    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat membuat file zip.')
    } finally {
      setDownloadingZip(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-2">
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchFiles} disabled={loading} className="shrink-0">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
          </Button>
          <Button 
            onClick={handleDownloadBulk} 
            disabled={loading || downloadingZip || files.length === 0} 
            className="shrink-0 bg-primary hover:bg-primary/90 shadow-sm"
          >
            {downloadingZip ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyiapkan Zip...</>
            ) : (
              <><FolderArchive className="w-4 h-4 mr-2" /> Unduh Semua (.zip)</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-6 md:col-span-4">Nama File</div>
          <div className="col-span-3 hidden md:block">Kategori</div>
          <div className="col-span-2 hidden md:block text-right">Ukuran</div>
          <div className="col-span-2 hidden md:block text-right">Dibuat</div>
          <div className="col-span-6 md:col-span-1 text-right">Aksi</div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
              <p>Memuat file...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">Tidak ada lampiran</p>
              <p className="text-sm mt-1">Storage lampiran Anda saat ini kosong.</p>
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/80 transition-colors">
                <div className="col-span-6 md:col-span-4 flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 md:hidden">{file.category}</p>
                      {mappings[file.fullPath] ? (
                        <a 
                          href={`/admin/requests/${mappings[file.fullPath]}`}
                          className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          Lihat Permintaan
                        </a>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-200" title="File ini tidak ditautkan ke permohonan manapun (Mungkin permintaan cuti telah dihapus). Aman untuk dihapus.">
                          Tanpa Referensi (Aman Dihapus)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3 hidden md:flex items-center">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                    {file.category}
                  </span>
                </div>
                
                <div className="col-span-2 hidden md:block text-right text-sm text-slate-500 font-medium">
                  {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                </div>
                
                <div className="col-span-2 hidden md:block text-right text-sm text-slate-500">
                  {new Date(file.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                
                <div className="col-span-6 md:col-span-1 flex items-center justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Unduh"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                    onClick={() => handleDownloadSingle(file.fullPath, file.name)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Hapus"
                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(file.fullPath)}
                    disabled={deletingId === file.fullPath}
                  >
                    {deletingId === file.fullPath ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {!loading && files.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center font-medium">
            <span>Total {files.length} File</span>
            <span>
              Total Ukuran:{' '}
              {(files.reduce((acc, curr) => acc + (curr.metadata?.size || 0), 0) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
