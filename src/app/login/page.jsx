'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nipLoginAction } from '@/app/actions/authActions'
import Link from 'next/link'
import { CalendarDays, ArrowRight, ArrowLeft, RefreshCw, KeyRound, ShieldAlert } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  
  // Captcha states
  const [captchaText, setCaptchaText] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const canvasRef = useRef(null)

  const supabase = createClient()

  // Generate local secure distorted canvas CAPTCHA
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz' // Exclude easily confused chars (1, I, 0, O, l)
    let text = ''
    for (let i = 0; i < 5; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(text)
    
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Clear canvas and draw clean slate background
    ctx.fillStyle = '#f8fafc' // slate-50 matches tailwind
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 1. Draw noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random()*130)}, ${Math.floor(Math.random()*130)}, ${Math.floor(Math.random()*130)}, 0.2)`
      ctx.lineWidth = 1.5 + Math.random() * 2
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }
    
    // 2. Draw noise dots
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random()*130)}, ${Math.floor(Math.random()*130)}, ${Math.floor(Math.random()*130)}, 0.25)`
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 3. Draw distorted characters
    ctx.textBaseline = 'middle'
    const charWidth = canvas.width / 5
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i)
      ctx.font = `bold ${24 + Math.random() * 5}px sans-serif`
      // Distorted dark theme-tailored colors
      ctx.fillStyle = `rgb(${Math.floor(Math.random()*90)}, ${Math.floor(Math.random()*90)}, ${Math.floor(Math.random()*150) + 60})`
      
      ctx.save()
      // Translate coordinates to character slot center
      ctx.translate((i * charWidth) + (charWidth / 2), canvas.height / 2)
      // Rotate slightly (-25 to 25 degrees)
      const angle = (Math.random() - 0.5) * 0.45
      ctx.rotate(angle)
      ctx.fillText(char, -10, 2)
      ctx.restore()
    }
  }

  // Trigger CAPTCHA generation once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      generateCaptcha()
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      
    url = url.startsWith('http') ? url : `https://${url}`;
    url = url.endsWith('/') ? url.slice(0, -1) : url;
    return url;
  };

function isSupabaseOffline(error) {
  if (!error) return false
  const msg = typeof error === 'string' ? error.toLowerCase() : (error.message || '').toLowerCase()
  const status = error.status || error.code
  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('service unavailable') ||
    msg.includes('bad gateway') ||
    msg.includes('paused') ||
    msg.includes('connection') ||
    msg.includes('network') ||
    msg.includes('timeout')
  )
}

  // Google Login Auth
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}/auth/callback`,
        },
      })

      if (error) {
        console.error("Google Auth Error:", error)
        if (isSupabaseOffline(error)) {
          setError("Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server.")
        } else {
          setError(error.message)
        }
        setLoading(false)
      }
    } catch (err) {
      console.error("Google Auth Exception:", err)
      if (isSupabaseOffline(err)) {
        setError("Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server.")
      } else {
        setError("Koneksi bermasalah. Silakan periksa jaringan Anda.")
      }
      setLoading(false)
    }
  }

  // Secure NIP/Password Login Auth with CAPTCHA Shield
  const handleNipLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1. Verify CAPTCHA input (case-insensitive)
    if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) {
      setError('Kode keamanan CAPTCHA tidak sesuai. Silakan coba lagi.')
      setCaptchaInput('')
      generateCaptcha()
      setLoading(false)
      return
    }

    // 2. Call Server Action to authenticate
    try {
      const res = await nipLoginAction(nip.trim(), password.trim())
      if (res?.error) {
        if (isSupabaseOffline(res.error)) {
          setError("Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server.")
        } else {
          setError(res.error)
        }
        generateCaptcha()
        setCaptchaInput('')
        setLoading(false)
      } else {
        // Force fully refreshed navigation to build correct server session cookies
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error(err)
      if (isSupabaseOffline(err)) {
        setError("Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server.")
      } else {
        setError('Koneksi bermasalah. Silakan periksa jaringan Anda.')
      }
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
        {/* Login Card */}
        <div className="w-full max-w-md space-y-7 bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100/60 ring-1 ring-slate-900/5 relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20 shadow-inner">
              <CalendarDays className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Masuk dengan NIP resmi Anda atau melalui Google.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleNipLogin} className="space-y-4">
            {/* NIP */}
            <div className="space-y-1.5">
              <Label htmlFor="nip" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Nomor Induk Pegawai (NIP)</Label>
              <div className="relative">
                <Input
                  id="nip"
                  name="nip"
                  placeholder="Masukkan NIP resmi Anda..."
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  maxLength={19}
                  required
                  className="h-11 pl-3 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Password</Label>
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full flex items-center gap-1 border border-primary/10">
                  <KeyRound className="w-3 h-3 text-primary" /> Kredensial = NIP
                </span>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password NIP Anda..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20"
              />
            </div>

            {/* Bot Protection CAPTCHA Canvas Shield */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Perisai Keamanan (CAPTCHA)
                </span>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-1.5 text-slate-500 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* distorter canvas */}
                <div className="rounded-xl overflow-hidden border border-slate-200/80 shadow-xs flex-shrink-0 bg-slate-50">
                  <canvas
                    ref={canvasRef}
                    width={140}
                    height={46}
                    id="captcha-canvas"
                    className="block select-none pointer-events-none"
                  />
                </div>

                <Input
                  id="captcha"
                  name="captcha"
                  placeholder="Ketik kode..."
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  maxLength={5}
                  required
                  className="h-11 rounded-xl bg-white border-slate-200 font-mono tracking-widest text-center text-sm focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Error Message Toast */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-semibold text-center leading-relaxed shadow-xs animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow-md rounded-xl bg-primary text-white hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Masuk Sekarang'
              )}
            </Button>
          </form>

          {/* Separator Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200/80"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Atau</span>
            <div className="flex-grow border-t border-slate-200/80"></div>
          </div>

          {/* Google Auth Option */}
          <Button 
            className="group w-full h-11 text-sm font-semibold transition-all shadow-xs hover:shadow-sm rounded-xl flex items-center justify-center gap-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer" 
            variant="outline" 
            onClick={handleGoogleLogin} 
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
            ) : (
              <svg className="h-4.5 w-4.5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            )}
            <span>Masuk dengan Google</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all -ml-5 group-hover:ml-0" />}
          </Button>

          {/* Footer Terms */}
          <p className="text-center text-[10px] font-medium text-slate-400 leading-normal">
            Sistem Keamanan Terintegrasi Sicerdas. <br/> Seluruh aktivitas akses log dicatat secara resmi.
          </p>
        </div>
      </div>
    </>
  )
}
