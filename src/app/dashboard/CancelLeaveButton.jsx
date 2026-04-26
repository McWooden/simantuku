'use client'

import { useState } from 'react'
import { deleteLeaveAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function CancelLeaveButton({ leaveId }) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus permintaan cuti ini? Kuota Anda akan dikembalikan otomatis.')) {
      return
    }

    setLoading(true)
    const res = await deleteLeaveAction(leaveId)
    if (res?.error) {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      disabled={loading}
      onClick={handleCancel}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 gap-1.5"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      Hapus
    </Button>
  )
}
