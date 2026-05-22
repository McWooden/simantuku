'use client'

import { useFormStatus } from 'react-dom'
import { Button } from './button'
import { Loader2 } from 'lucide-react'

export function SubmitButton({ 
  children, 
  loadingText = 'Menyimpan...', 
  className, 
  variant, 
  size, 
  disabled,
  ...props 
}) {
  const { pending } = useFormStatus()

  return (
    <Button 
      type="submit" 
      disabled={pending || disabled} 
      className={className} 
      variant={variant} 
      size={size} 
      {...props}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? loadingText : children}
    </Button>
  )
}
