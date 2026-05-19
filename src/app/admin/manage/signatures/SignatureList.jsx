'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react'

export default function SignatureList({ employees }) {
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  
  const supabase = createClient()

  const fetchSignatures = async () => {
    setLoading(true)
    try {
      // List all folders (employee IDs) in the signatures bucket
      const { data: folders, error } = await supabase.storage
        .from('signatures')
        .list('', { limit: 1000 })
        
      if (error) throw error

      // folders is an array of items, some of which might be folders (employee IDs)
      // Actually in Supabase, .list('') returns folders.
      const employeeIdsWithFolders = folders.map(f => f.name)
      
      const sigList = []
      
      // Now verify if signature.png exists in those folders
      const checkPromises = employeeIdsWithFolders.map(async (empId) => {
        if (empId === '.emptyFolderPlaceholder') return
        
        const { data: files } = await supabase.storage
          .from('signatures')
          .list(empId)
          
        if (files && files.some(f => f.name === 'signature.png')) {
          const emp = employees.find(e => e.id === empId)
          sigList.push({
            employeeId: empId,
            employeeName: emp ? emp.name : 'Unknown Employee',
            employeeNip: emp ? emp.nip : '-',
            fullPath: `${empId}/signature.png`,
            fileSize: files.find(f => f.name === 'signature.png')?.metadata?.size || 0
          })
        }
      })

      await Promise.all(checkPromises)
      
      setSignatures(sigList.sort((a, b) => a.employeeName.localeCompare(b.employeeName)))
    } catch (err) {
      console.error('Error fetching signatures:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignatures()
  }, [employees])

  const handleDelete = async (fullPath, empName) => {
    if (!confirm(`Anda yakin ingin menghapus tanda tangan untuk ${empName}?`)) return
    
    setDeletingId(fullPath)
    try {
      const { error } = await supabase.storage
        .from('signatures')
        .remove([fullPath])

      if (error) throw error

      setSignatures(prev => prev.filter(s => s.fullPath !== fullPath))
    } catch (err) {
      console.error(err)
      alert(`Gagal menghapus tanda tangan: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Daftar Tanda Tangan</h3>
        <Button variant="outline" size="sm" onClick={fetchSignatures} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : signatures.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium">Belum ada tanda tangan</p>
              <p className="text-xs mt-1">Tanda tangan yang diunggah akan muncul di sini.</p>
            </div>
          ) : (
            signatures.map((sig) => (
              <div key={sig.employeeId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                    <span className="text-xs font-bold">{sig.employeeName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">{sig.employeeName}</p>
                    <p className="text-xs text-slate-500">
                      NIP. {sig.employeeNip} • {(sig.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(sig.fullPath, sig.employeeName)}
                  disabled={deletingId === sig.fullPath}
                >
                  {deletingId === sig.fullPath ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
