'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarDays, ArrowRight, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      
    url = url.startsWith('http') ? url : `https://${url}`;
    url = url.endsWith('/') ? url.slice(0, -1) : url;
    return url;
  };

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
        
        {/* Login Form */}
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100/60 ring-1 ring-slate-900/5 relative overflow-hidden">
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 ring-1 ring-primary/20 shadow-inner">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="mt-2 text-sm text-slate-500">
              Masuk ke akun Anda untuk melanjutkan ke dashboard.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Button 
              className="group w-full h-12 text-base font-medium transition-all shadow-sm hover:shadow-md rounded-xl flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50" 
              variant="outline" 
              onClick={handleGoogleLogin} 
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
              ) : (
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
              )}
              <span>{loading ? 'Mengarahkan...' : 'Lanjutkan dengan Google'}</span>
              {!loading && <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />}
            </Button>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium text-center shadow-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Dengan masuk, Anda menyetujui persyaratan layanan <br className="hidden sm:block"/> dan kebijakan privasi instansi.
          </p>
        </div>

      </div>
    </>
  )
}
