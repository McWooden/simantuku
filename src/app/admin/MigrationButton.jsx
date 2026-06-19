'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { runOneTimeMigrationAction } from '@/app/actions/leaveActions'
import { Loader2, Database } from 'lucide-react'

export function MigrationButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleMigration = async () => {
    if (!confirm("Apakah Anda yakin ingin menjalankan migrasi data cuti historis? Pastikan query setup.sql sudah dijalankan di Supabase SQL Editor.")) return
    setLoading(true)
    setResult(null)
    try {
      const res = await runOneTimeMigrationAction()
      if (res?.error) {
        setResult({ success: false, message: res.error })
      } else {
        setResult({ success: true, message: `Migrasi berhasil! Memproses ${res.migratedCount} data cuti.` })
      }
    } catch (err) {
      setResult({ success: false, message: "Terjadi kesalahan yang tidak terduga." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-slate-800">Inisialisasi Chaining Quota</h3>
          <p className="text-xs text-slate-500">
            Jalankan migrasi satu kali untuk menghubungkan pengajuan cuti lama ke dalam chain database.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button onClick={handleMigration} disabled={loading} className="rounded-xl">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Jalankan Migrasi
        </Button>
        {result && (
          <p className={`text-xs font-semibold ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  )
}
