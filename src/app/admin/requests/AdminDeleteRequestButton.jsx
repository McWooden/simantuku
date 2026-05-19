'use client'

import { useState } from 'react'
import { adminDeleteLeaveAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function AdminDeleteRequestButton({ requestId }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Anda yakin ingin menghapus permohonan ini secara permanen? Data yang dihapus tidak dapat dikembalikan.')) return
    
    setLoading(true)
    const res = await adminDeleteLeaveAction(requestId)

    if (res?.error) {
      alert(res.error)
      setLoading(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 shadow-sm"
      onClick={handleDelete}
      disabled={loading}
      title="Hapus Permintaan"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
      Hapus
    </Button>
  )
}
