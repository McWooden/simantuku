'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, UserCheck, ArrowLeft } from 'lucide-react'

export default function PendingPage() {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    let active = true
    const logoutUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && active) {
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '')
      }
      await supabase.auth.signOut()
    }
    logoutUser()
    return () => { active = false }
  }, [])

  return (
    <>
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-12">
        <div className="max-w-lg w-full space-y-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center">
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Menunggu Verifikasi Admin
            </h2>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Terima kasih telah login{userName ? `, ${userName}` : ''}. Akun Google Anda saat ini belum ditautkan dengan profil pegawai. 
              <strong> Kami akan segera menautkan akun Anda.</strong>
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">Progres Pembuatan Akun</h3>
            <div className="space-y-6 relative">
              
              {/* Vertical connecting line (Base) */}
              <div className="absolute left-3 top-6 bottom-8 w-[2px] bg-slate-100"></div>

              <div className="flex items-start relative z-10">
                {/* Active connecting line overlay */}
                <div className="absolute left-3 top-6 -bottom-6 w-[2px] bg-green-500 -z-10"></div>
                
                <div className="flex-shrink-0 bg-white rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-bold text-slate-900">Login dengan Google</h4>
                  <p className="mt-1 text-xs text-slate-500">Anda telah berhasil masuk menggunakan akun Google Anda.</p>
                </div>
              </div>

              <div className="flex items-start relative z-10">
                <div className="flex-shrink-0 bg-white rounded-full ring-4 ring-white">
                  <Clock className="h-6 w-6 text-amber-500 animate-pulse" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-bold text-slate-900">Menunggu Penautan Profil</h4>
                  <p className="mt-1 text-xs text-slate-500">Admin sedang memverifikasi data Anda dan menautkannya ke sistem cuti.</p>
                  <p className="mt-3 text-[11px] font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-100/50 inline-block">
                    Harap hubungi Admin jika kami tidak merespons dalam 1x24 jam.
                  </p>
                </div>
              </div>

              <div className="flex items-start relative z-10 opacity-40">
                <div className="flex-shrink-0 bg-white rounded-full">
                  <UserCheck className="h-6 w-6 text-slate-400" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-bold text-slate-900">Akun Aktif</h4>
                  <p className="mt-1 text-xs text-slate-500">Akun Anda siap digunakan untuk mengajukan cuti dan melihat sisa kuota.</p>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <Link href="/login" className="block w-full">
              <Button className="w-full rounded-full" size="lg" variant="outline">
                Kembali ke Halaman Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
