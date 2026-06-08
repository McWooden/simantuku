'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

export function NipInput({ id, name, defaultValue, placeholder, className, required }) {
  const [value, setValue] = useState(() => {
    if (defaultValue) {
      return String(defaultValue).replace(/\s+/g, '').slice(0, 18)
    }
    return ''
  })

  // Sync defaultValue when it changes, stripping spaces and capping length
  useEffect(() => {
    if (defaultValue) {
      setValue(String(defaultValue).replace(/\s+/g, '').slice(0, 18))
    } else {
      setValue('')
    }
  }, [defaultValue])

  const handleChange = (e) => {
    // Strip all space characters and limit length to 18
    const cleaned = e.target.value.replace(/\s+/g, '').slice(0, 18)
    setValue(cleaned)
  }

  return (
    <Input
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
    />
  )
}
