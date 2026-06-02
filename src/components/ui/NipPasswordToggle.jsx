'use client'

import { useState } from 'react'
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

  // Modal States
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  // Form States
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [modalError, setModalError] = useState('')

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
        setMessage('Kredensial NIP dinonaktifkan. Masuk hanya diizinkan menggunakan Google OAuth.')
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
        setMessage('Kredensial NIP berhasil diaktifkan! Pegawai sekarang dapat masuk menggunakan NIP dan password baru.')
        setShowActivateModal(false)
      }
    } catch (err) {
      console.error(err)
      setModalError('Terjadi kesalahan sistem. Harap coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-primary" />
              Akses Login Password NIP
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Izinkan login langsung menggunakan kredensial NIP (Username = NIP & Password kustom Anda). Pengaturan ini tetap berlaku meskipun akun telah ditautkan dengan Google.
            </p>
          </div>
          
          {/* Switch Toggle */}
          <button
            type="button"
            onClick={handleToggleClick}
            disabled={loading}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              enabled ? 'bg-primary' : 'bg-slate-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="sr-only">Toggle NIP Password Login</span>
            <span
              className={`pointer-events-none relative inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                enabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            >
              {loading && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
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
              Aktifkan Password NIP
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Silakan buat password baru untuk login berbasis NIP Anda. Untuk keamanan, gunakan minimal 6 karakter.
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
              Nonaktifkan Password NIP?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Apakah Anda yakin ingin menonaktifkan login password NIP?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="rounded-xl bg-rose-50/50 border border-rose-100 p-4 text-xs text-rose-800 leading-relaxed">
              <strong>⚠️ PENTING:</strong> Password aktif Anda saat ini akan <strong>dihapus secara permanen</strong> di database keamanan. Anda harus membuat password baru dari awal jika ingin mengaktifkan fitur ini kembali di kemudian hari.
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
    </>
  )
}
