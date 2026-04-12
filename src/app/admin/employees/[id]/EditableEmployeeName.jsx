'use client'

import { useState } from 'react'
import { updateEmployeeAction } from '@/app/actions/employeeActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Check, X } from 'lucide-react'

export function EditableEmployeeName({ employeeId, initialName }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (name.trim() === initialName) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    const res = await updateEmployeeAction(employeeId, { name: name.trim() })
    if (res?.error) {
      alert(res.error)
      setName(initialName)
    }
    setLoading(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setName(initialName)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-1 mb-2">
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="text-xl font-bold h-9 w-64"
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
          className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleCancel} 
          disabled={loading}
          className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2">
      <div className="text-2xl font-bold">{name}</div>
      <Button
        size="icon"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  )
}
