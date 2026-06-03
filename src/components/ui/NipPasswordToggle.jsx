'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleNipPasswordAction } from '@/app/actions/authActions'
import { Loader2, KeyRound, ShieldCheck, ShieldAlert, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NipPasswordToggle({ employee }) {
  const [enabled, setEnabled] = useState(employee.is_password_enabled || false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Google Link States
  const [googleLinked, setGoogleLinked] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Modal States
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showUnlinkGoogleModal, setShowUnlinkGoogleModal] = useState(false)

  // Form States
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [modalError, setModalError] = useState('')

  // Check linked identities on mount
  useEffect(() => {
    async function checkIdentities() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.identities) {
          const hasGoogle = user.identities.some(identity => identity.provider === 'google')
          setGoogleLinked(hasGoogle)
        }
      } catch (err) {
        console.error("Gagal memeriksa identitas terhubung:", err)
      }
    }
    checkIdentities()
  }, [])

  const handleToggleClick = () => {
    setMessage('')
    setError('')
    setModalError('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)

    if (enabled) {
      setShowDeactivateModal(true)
    } else {
      setShowActivateModal(true)
    }
  }

  const handleDeactivate = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      const res = await toggleNipPasswordAction(employee.id, false)
      if (res?.error) {
        setError(res.error)
      } else {
        setEnabled(false)
        setMessage('Akses login dengan password dinonaktifkan. Masuk hanya diizinkan menggunakan Google OAuth.')
        setShowDeactivateModal(false)
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem. Harap coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!password) {
      setModalError('Password harus diisi.')
      return
    }

    if (password.length < 6) {
      setModalError('Password minimal harus 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setModalError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const res = await toggleNipPasswordAction(employee.id, true, password)
      if (res?.error) {
        setModalError(res.error)
      } else {
        setEnabled(true)
        setMessage('Akses login dengan password berhasil diaktifkan! Anda sekarang dapat masuk menggunakan username dan password baru.')
        setShowActivateModal(false)
      }
    } catch (err) {
      console.error(err)
      setModalError('Terjadi kesalahan sistem. Harap coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  // Google identity linking
  const handleLinkGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback`
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (linkError) {
        setError(`Gagal menautkan akun Google: ${linkError.message}`)
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan koneksi saat menautkan Google.')
      setGoogleLoading(false)
    }
  }

  // Google identity unlinking
  const handleUnlinkGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Pengguna tidak terautentikasi.')
        setGoogleLoading(false)
        setShowUnlinkGoogleModal(false)
        return
      }

      const googleIdentity = user.identities?.find(identity => identity.provider === 'google')
      if (!googleIdentity) {
        setError('Tautan Google tidak ditemukan pada akun ini.')
        setGoogleLoading(false)
        setShowUnlinkGoogleModal(false)
        return
      }

      const { error: unlinkError } = await supabase.auth.unlinkIdentity(googleIdentity)
      if (unlinkError) {
        setError(`Gagal melepas tautan Google: ${unlinkError.message}`)
      } else {
        setGoogleLinked(false)
        setMessage('Tautan akun Google berhasil dilepas.')
      }
      setShowUnlinkGoogleModal(false)
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem saat melepas tautan Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-5 shadow-xs relative overflow-hidden transition-all duration-300">
        
        {/* Row 1: Password Login */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-primary" />
              Login dengan Password
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Izinkan login langsung menggunakan username dan password Anda. Pengaturan ini tetap berlaku meskipun akun telah ditautkan dengan Google.
            </p>
          </div>
          
          {/* Switch Toggle Password */}
          <button
            type="button"
            onClick={handleToggleClick}
            disabled={loading}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              enabled ? 'bg-primary' : 'bg-slate-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="sr-only">Toggle Password Login</span>
            <span
              className={`pointer-events-none relative inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                enabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            >
              {loading && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
            </span>
          </button>
        </div>

        <div className="border-t border-slate-200/50 my-1"></div>

        {/* Row 2: Google Link */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <svg className="h-4.5 w-4.5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Tautkan dengan Google
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Hubungkan akun Anda ke Google OAuth untuk kemudahan login sekali klik menggunakan email resmi.
            </p>
          </div>

          {/* Switch Toggle Google Link */}
          <button
            type="button"
            onClick={() => {
              if (googleLinked) {
                setShowUnlinkGoogleModal(true)
              } else {
                handleLinkGoogle()
              }
            }}
            disabled={googleLoading}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              googleLinked ? 'bg-primary' : 'bg-slate-200'
            } ${googleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="sr-only">Toggle Google Account Link</span>
            <span
              className={`pointer-events-none relative inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                googleLinked ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            >
              {googleLoading && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
            </span>
          </button>
        </div>

        {/* Message feedback */}
        {message && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800 font-semibold animate-in fade-in duration-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-semibold animate-in fade-in duration-300">
            <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      {/* 1. Modal Aktivasi Password */}
      <Dialog open={showActivateModal} onOpenChange={(open) => !loading && setShowActivateModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <KeyRound className="w-5 h-5 text-primary" />
              Aktifkan Password Login
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Silakan buat password baru untuk login berbasis password Anda. Untuk keamanan, gunakan minimal 6 karakter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleActivate} className="space-y-4 py-2">
            {modalError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700 font-semibold">
                <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="leading-relaxed">{modalError}</p>
              </div>
            )}

            <div className="space-y-1.5 relative">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password baru..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ketik ulang password baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowActivateModal(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  'Aktifkan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Deaktivasi Password */}
      <Dialog open={showDeactivateModal} onOpenChange={(open) => !loading && setShowDeactivateModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Nonaktifkan Password Login?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Apakah Anda yakin ingin menonaktifkan login password?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="rounded-xl bg-rose-50/50 border border-rose-100 p-4 text-xs text-rose-800 leading-relaxed">
              <strong>⚠️ PENTING:</strong> Kredensial aktif Anda saat ini akan <strong>dihapus secara permanen</strong> di database keamanan. Anda harus membuat password baru dari awal jika ingin mengaktifkan fitur ini kembali di kemudian hari.
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeactivateModal(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menonaktifkan...
                </>
              ) : (
                'Ya, Nonaktifkan & Hapus Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Unlink Google */}
      <Dialog open={showUnlinkGoogleModal} onOpenChange={(open) => !googleLoading && setShowUnlinkGoogleModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Lepas Tautan Google?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Apakah Anda yakin ingin melepas tautan akun Google Anda dari sistem Sicerdas?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {!enabled ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed space-y-2">
                <strong>⚠️ PERINGATAN KEKUNCI:</strong>
                <p>
                  Akses login dengan password Anda saat ini <strong>dinonaktifkan</strong>. 
                  Jika Anda melepas tautan Google sekarang, Anda tidak akan memiliki metode login aktif apa pun dan akan <strong>terkunci dari sistem</strong>!
                </p>
                <p>
                  Silakan aktifkan login dengan password terlebih dahulu sebelum melepas tautan Google.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600 leading-relaxed">
                Setelah dilepas, Anda tidak lagi bisa masuk menggunakan tombol &quot;Lanjutkan dengan Google&quot; kecuali Anda menautkannya kembali.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUnlinkGoogleModal(false)}
              disabled={googleLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleUnlinkGoogle}
              disabled={googleLoading || !enabled}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                'Ya, Lepas Tautan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
