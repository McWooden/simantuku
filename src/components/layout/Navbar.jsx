'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Home, Menu, X } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [employeeName, setEmployeeName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('role, name')
          .eq('auth_id', user.id)
          .maybeSingle()
        setRole(employee?.role || null)
        setEmployeeName(employee?.name || null)
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          const { data: employee } = await supabase
            .from('employees')
            .select('role, name')
            .eq('auth_id', session.user.id)
            .maybeSingle()
          setRole(employee?.role || null)
          setEmployeeName(employee?.name || null)
        } else {
          setRole(null)
          setEmployeeName(null)
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
    <div className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <nav className={`bg-primary text-primary-foreground shadow-2xl px-2 py-2 flex flex-col w-full max-w-3xl pointer-events-auto border border-primary-foreground/10 transition-all duration-300 ${isMenuOpen ? 'rounded-3xl' : 'rounded-full'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {/* Hamburger menu on Mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center mr-4 shrink-0 transition-transform hover:scale-105 shadow-sm cursor-pointer"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Home button on Desktop */}
            <Link href="/" className="hidden md:flex w-11 h-11 bg-white text-primary rounded-full items-center justify-center mr-8 shrink-0 transition-transform hover:scale-105 shadow-sm">
              <Home className="w-6 h-6" />
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
              {user && (
                <>
                  <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                  {(role === 'admin' || role === 'manager') && (
                    <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
                  )}
                </>
              )}
              <Link href="/help" className="hover:text-white transition-colors">FAQ & Support</Link>
            </div>
          </div>

          <div className="flex items-center ml-4">
            {loading ? (
              <div className="w-24 h-11 bg-white/20 animate-pulse rounded-full"></div>
            ) : user ? (
              <Button
                variant="secondary"
                className="group relative bg-white text-primary hover:bg-white/90 rounded-full h-11 px-6 font-medium shadow-sm overflow-hidden"
                onClick={handleLogout}
              >
                <span className="block transition-transform duration-300 group-hover:-translate-y-12">
                  {employeeName || user.email || 'Akun'}
                </span>
                <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 translate-y-12 group-hover:translate-y-0 text-red-600 font-bold">
                  Log out
                </span>
              </Button>
            ) : (
              <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 rounded-full h-11 px-6 font-medium shadow-sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>
        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col gap-3.5 pt-4 pb-2 px-2 border-t border-white/10 mt-3 w-full animate-in fade-in slide-in-from-top-3 duration-200">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:text-white text-white/90 transition-colors text-sm font-semibold py-1">Beranda</Link>
            {user && (
              <>
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="hover:text-white text-white/90 transition-colors text-sm font-semibold py-1">Dashboard</Link>
                {(role === 'admin' || role === 'manager') && (
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="hover:text-white text-white/90 transition-colors text-sm font-semibold py-1">Admin</Link>
                )}
              </>
            )}
            <Link href="/help" onClick={() => setIsMenuOpen(false)} className="hover:text-white text-white/90 transition-colors text-sm font-semibold py-1">FAQ & Support</Link>
          </div>
        )}
      </nav>
    </div>
  )
}
