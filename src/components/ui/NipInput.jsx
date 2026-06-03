'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

export function NipInput({ id, name, defaultValue, placeholder, className, required }) {
  const [value, setValue] = useState(defaultValue || '')

  useEffect(() => {
    if (defaultValue && defaultValue !== value) {
      setValue(defaultValue)
    }
  }, [defaultValue, value])

  // Filter out all spaces from the input value using useEffect
  useEffect(() => {
    if (/\s/.test(value)) {
      setValue(value.replace(/\s+/g, ''))
    }
  }, [value])

  return (
    <Input
      id={id}
      name={name}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={className}
      required={required}
    />
  )
}
