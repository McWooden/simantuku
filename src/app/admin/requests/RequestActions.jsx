'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeaveStatusAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export function RequestActions({ requestId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (status) => {
    setLoading(true)
    const res = await updateLeaveStatusAction(requestId, status)

    if (res?.error) {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex justify-end gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={() => handleUpdate('acc')}
        disabled={loading}
      >
        <Check className="h-4 w-4 mr-1" />
        Setujui
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => handleUpdate('ditolak')}
        disabled={loading}
      >
        <X className="h-4 w-4 mr-1" />
        Tolak
      </Button>
    </div>
  )
}
