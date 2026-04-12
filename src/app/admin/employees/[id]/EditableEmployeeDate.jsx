'use client'

import { useState } from 'react'
import { updateEmployeeAction } from '@/app/actions/employeeActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Check, X } from 'lucide-react'
import { format } from 'date-fns'

export function EditableEmployeeDate({ employeeId, initialDate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [date, setDate] = useState(initialDate || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (date === (initialDate || '')) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    const res = await updateEmployeeAction(employeeId, { start_date: date || null })
    if (res?.error) {
      alert(res.error)
      setDate(initialDate || '')
    }
    setLoading(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDate(initialDate || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <Input 
          type="date"
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="h-8 w-40"
          autoFocus 
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleSave} 
          disabled={loading}
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleCancel} 
          disabled={loading}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <span className="text-muted-foreground">
        {date ? format(new Date(date), 'MMMM d, yyyy') : 'Not set'}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  )
}
