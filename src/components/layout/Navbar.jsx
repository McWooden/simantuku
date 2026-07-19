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
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error fetching user session:", error)
      } finally {
        setLoading(false)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/signout'
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <nav className={`bg-white/85 backdrop-blur-md text-slate-800 shadow-lg px-4 py-2.5 flex flex-col w-full max-w-4xl pointer-events-auto border border-slate-200/50 transition-all duration-300 ${isMenuOpen ? 'rounded-2xl' : 'rounded-full'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {/* Hamburger menu on Mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-3 shrink-0 transition-transform hover:scale-105 shadow-sm cursor-pointer"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Home/Logo Link on Desktop */}
            <Link href="/" className="flex items-center gap-2 mr-6 shrink-0 transition-opacity hover:opacity-90">
              <img 
                src="/favicon-io/favicon-32x32.png" 
                className="w-6 h-6 object-contain" 
                alt="Logo" 
              />
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Si Cerdas</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-slate-650">
              {user && (
                <Link href="/dashboard" className="hover:text-primary transition-colors text-slate-500">Dashboard</Link>
              )}
              <Link href="/help" className="hover:text-primary transition-colors text-slate-500">FAQ & Support</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-slate-100 animate-pulse rounded-full"></div>
            ) : user ? (
              <Button
                variant="secondary"
                className="bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-full h-9 px-5 font-semibold text-[12px] shadow-sm transition-all"
                onClick={handleLogout}
              >
                Log out
              </Button>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-block text-[13px] font-bold text-slate-600 hover:text-primary px-3 py-2 transition-colors">
                  Log in
                </Link>
                <Button size="sm" className="bg-primary text-white hover:bg-primary/95 rounded-full h-9 px-5 font-bold text-[12px] shadow-md shadow-primary/15 transition-all hover:scale-[1.02]" asChild>
                  <Link href="/form">Ajukan Cuti</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col gap-2.5 pt-4 pb-2 px-2 border-t border-slate-100 mt-3 w-full animate-in fade-in slide-in-from-top-3 duration-200">
            {user && (
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="hover:text-primary text-slate-600 transition-colors text-sm font-semibold py-1">Dashboard</Link>
            )}
            <Link href="/help" onClick={() => setIsMenuOpen(false)} className="hover:text-primary text-slate-600 transition-colors text-sm font-semibold py-1">FAQ & Support</Link>
            {!user && (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="hover:text-primary text-slate-600 transition-colors text-sm font-semibold py-1 border-t border-slate-50 pt-2.5">Log in</Link>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
