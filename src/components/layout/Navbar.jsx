'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          setRole(profile?.role)
        } else {
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    // We use a hidden form submission to our server-side route
    // This is much more robust against browser CSP blocks
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/signout'
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Cuti<span className="text-primary">App</span>
          </Link>
          {user && (
            <div className="hidden md:flex gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Dashboard
              </Link>
              {role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary border-l pl-4">
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
