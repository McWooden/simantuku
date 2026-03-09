'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export function RequestActions({ requestId }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (status) => {
    setLoading(true)
    const { error } = await supabase
      .from('cuti')
      .update({ status })
      .eq('id', requestId)

    if (error) {
      alert(error.message)
    } else {
      router.refresh()
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
        Approve
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => handleUpdate('ditolak')}
        disabled={loading}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  )
}
