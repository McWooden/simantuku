'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { submitLeaveAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DownloadPdfButton } from '@/components/ui/DownloadPdfButton'
import { generateLeavePDF, COORDS } from '@/lib/pdfGenerator'
import { Eye, EyeOff } from 'lucide-react'

export default function LeaveFormPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [checkingPending, setCheckingPending] = useState(true)
  const [hasPending, setHasPending] = useState(false)
  const [employeeName, setEmployeeName] = useState('')
  const [error, setError] = useState('')
  const [quotas, setQuotas] = useState({ sisaN: 0, sisaN1: 0, sisaN2: 0 })
  const [customCoords, setCustomCoords] = useState(COORDS)
  const [devMode, setDevMode] = useState(false)

  // Check for pending requests on mount
  useEffect(() => {
    async function checkPending() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: employee } = await supabase.from('employees').select('id, name').eq('auth_id', user.id).single()
          if (employee) {
            setEmployeeName(employee.name)
            const { count } = await supabase.from('cuti').select('*', { count: 'exact', head: true }).eq('employee_id', employee.id).eq('status', 'pending')
            setHasPending(count > 0)

            const { getLeaveQuotaOverviewAction } = await import('@/app/actions/leaveActions')
            const overview = await getLeaveQuotaOverviewAction(employee.id)
            const currentYear = new Date().getFullYear()
            const b = overview.buckets || []
            const sisaN = b.find(x => x.year === currentYear)?.remaining || 0
            const sisaN1 = b.find(x => x.year === currentYear - 1)?.remaining || 0
            const sisaN2 = b.find(x => x.year === currentYear - 2)?.remaining || 0
            setQuotas({ sisaN, sisaN1, sisaN2 })
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCheckingPending(false)
      }
    }
    checkPending()
  }, [])
  const [dates, setDates] = useState([])
  const [category, setCategory] = useState('Tahunan')
  const [note, setNote] = useState('')

  const [showPreview, setShowPreview] = useState(true)
  const [pdfUrl, setPdfUrl] = useState(null)

  // Live Preview effect
  useEffect(() => {
    let active = true
    const updatePreview = async () => {
      try {
        const blob = await generateLeavePDF({
          name: employeeName,
          category,
          dates,
          note,
          quotas,
          customCoords
        })
        if (active) {
          const url = URL.createObjectURL(blob)
          setPdfUrl(oldUrl => {
            if (oldUrl) URL.revokeObjectURL(oldUrl)
            return url
          })
        }
      } catch (e) {
        console.error("Preview generation failed:", e)
      }
    }
    updatePreview()
    return () => { active = false }
  }, [employeeName, category, dates, note, quotas, customCoords])

  const handleCategoryChange = (val) => {
    setCategory(val)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!category) {
        setError('Please select a leave category.')
        return
      }

      if (dates.length === 0) {
        setError('Please select at least one date.')
        return
      }

      // Sort dates and convert to YYYY-MM-DD
      const formattedDates = [...dates]
        .sort((a, b) => a.getTime() - b.getTime())
        .map(d => {
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        })

      const res = await submitLeaveAction(category, formattedDates, note);

      if (res?.error) {
        setError(res.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left Form Column */}
        <div className={`transition-all duration-500 w-full ${showPreview ? 'lg:w-[45%]' : 'lg:max-w-3xl lg:mx-auto'}`}>
          <div className="mb-6 flex flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ajukan Cuti</h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Selesaikan langkah-langkah untuk mengirim formulir Anda
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="hidden lg:flex gap-2 shrink-0 ml-4 rounded-full shadow-sm">
              {showPreview ? <><EyeOff className="w-4 h-4" /> Sembunyikan Pratinjau</> : <><Eye className="w-4 h-4" /> Tampilkan Pratinjau</>}
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {hasPending && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl flex gap-3 text-amber-800 shadow-sm mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-base">Akses Dibatasi</p>
                  <p className="mt-1">Anda saat ini memiliki permintaan yang <strong>Menunggu</strong>. Anda tidak dapat mengirim permintaan baru sampai permintaan saat ini disetujui, ditolak, atau dibatalkan.</p>
                </div>
              </div>
            )}

            <div className={`space-y-6 ${hasPending ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

              {/* Step 1: Category */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="bg-slate-50/50 border-b px-6 py-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <CardTitle className="text-lg">Kategori Cuti</CardTitle>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Select value={category} onValueChange={handleCategoryChange}>
                      <SelectTrigger id="category" className="h-11">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tahunan">Cuti Tahunan</SelectItem>
                        <SelectItem value="Besar">Cuti Besar</SelectItem>
                        <SelectItem value="Sakit">Cuti Sakit</SelectItem>
                        <SelectItem value="Melahirkan">Cuti Melahirkan</SelectItem>
                        <SelectItem value="Penting">Cuti Karena Alasan Penting</SelectItem>
                        <SelectItem value="LuarTanggungan">Cuti di Luar Tanggungan Negara</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Dates */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="bg-slate-50/50 border-b px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    <CardTitle className="text-lg">Pilih Tanggal</CardTitle>
                  </div>
                  {dates.length > 0 && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full animate-in fade-in zoom-in">
                      {dates.length} Hari Terpilih
                    </span>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-center bg-slate-50/50 rounded-xl border p-2">
                    <Calendar
                      mode="multiple"
                      selected={dates}
                      onSelect={setDates}
                      className="rounded-md"
                      modifiers={{
                        weekend: (date) => date.getDay() === 0 || date.getDay() === 6
                      }}
                      modifiersClassNames={{
                        weekend: "text-amber-600 bg-amber-50/60 font-semibold hover:bg-amber-100 hover:text-amber-700 data-[selected-single=true]:bg-amber-500 data-[selected-single=true]:text-white"
                      }}
                    />
                  </div>
                  {dates.length === 0 && (
                    <p className="text-center text-sm text-slate-500 mt-4 italic">
                      Harap pilih setidaknya satu tanggal dari kalender.
                    </p>
                  )}
                  {dates.some(d => d.getDay() === 0 || d.getDay() === 6) && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2 text-sm animate-in fade-in zoom-in duration-300">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block mb-0.5 text-amber-900">Peringatan Akhir Pekan!</strong>
                        <p className="opacity-90">
                          Anda memilih tanggal pada hari Sabtu atau Minggu. Hari kerja biasanya hanya Senin hingga Jumat.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 3: Notes */}
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="bg-slate-50/50 border-b px-6 py-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <CardTitle className="text-lg">Catatan Tambahan</CardTitle>
                </div>
                <CardContent className="p-6">
                  <NoteInput value={note} onChange={setNote} />
                  {error && <p className="text-sm text-destructive font-medium mt-4 bg-destructive/10 p-3 rounded-md">{error}</p>}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={() => router.push('/dashboard')}>
                  Batal
                </Button>
                <Button type="submit" size="lg" className="min-w-[150px] shadow-sm rounded-full" disabled={loading || hasPending || checkingPending}>
                  {loading ? 'Mengirim...' : hasPending ? 'Permintaan Diblokir' : 'Kirim Permintaan'}
                </Button>
              </div>

            </div>
          </form>
        </div>

        {/* Right Preview Column */}
        {showPreview && (
          <div className="w-full lg:w-[55%] sticky top-6 animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Dokumen Langsung</h2>
              <div className="flex items-center gap-2">
                <DownloadPdfButton employeeName={employeeName} leave={{ category, dates, note }} />
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="lg:hidden text-xs">
                  Tutup Pratinjau
                </Button>
              </div>
            </div>

            <div className="relative bg-[#525659] h-[75vh] rounded overflow-hidden shadow-2xl ring-1 ring-slate-900/10 flex items-center justify-center">
              {pdfUrl ? (
                <div className="w-full h-full bg-white shadow-xl max-w-[800px] mx-auto animate-in fade-in duration-300">
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                  <p className="text-sm font-medium">Membuat dokumen via pdf-lib...</p>
                </div>
              )}
            </div>

            {/* Dev Coordinate Tuner */}
            <div className="mt-4 bg-slate-100 rounded-xl overflow-hidden ring-1 ring-slate-200">
              <div className="flex justify-between items-center p-3 bg-slate-200/50">
                <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Penyesuai Koordinat Dev
                </h3>
                <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={() => setDevMode(!devMode)}>
                  {devMode ? 'Tutup Panel' : 'Buka Penyesuai'}
                </Button>
              </div>
              {devMode && (
                <div className="p-3 grid grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[30vh]">
                  {Object.entries(customCoords).map(([key, val]) => {
                    const isFocusItems = ['sisaN', 'sisaN1', 'sisaN2'].includes(key);
                    return (
                      <div key={key} className={`p-2 border rounded-lg bg-white shadow-sm transition-all ${isFocusItems ? 'ring-1 ring-primary/30 border-primary/20' : ''}`}>
                        <div className="font-semibold text-xs mb-1 text-slate-600 truncate" title={key}>{key}</div>
                        <div className="flex flex-col gap-1 text-[10px]">
                          <label className="flex items-center gap-2">
                            <span className="w-3 text-slate-400 font-medium">X</span>
                            <Input type="number" className="h-6 text-xs px-1.5" value={val.x} onChange={e => setCustomCoords(prev => ({ ...prev, [key]: { ...prev[key], x: Number(e.target.value) } }))} />
                          </label>
                          <label className="flex items-center gap-2">
                            <span className="w-3 text-slate-400 font-medium">Y</span>
                            <Input type="number" className="h-6 text-xs px-1.5" value={val.y} onChange={e => setCustomCoords(prev => ({ ...prev, [key]: { ...prev[key], y: Number(e.target.value) } }))} />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                  <div className="col-span-full pt-2">
                    <Button variant="secondary" size="sm" className="w-full text-xs h-7" onClick={() => {
                      console.log("Exported Coords:", JSON.stringify(customCoords, null, 2))
                      alert("Koordinat dicetak ke konsol untuk di-copy-paste!")
                    }}>
                      Log Koordinat ke Konsol
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}


const NoteInput = memo(function NoteInput({ value, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="note">Catatan / Alasan (Opsional)</Label>
      <Textarea
        id="note"
        placeholder="Jelaskan secara singkat alasan cuti Anda..."
        defaultValue={value}
        maxLength={247}
        onBlur={(e) => onChange(e.target.value)}
      />
      <p className="text-[10px] text-muted-foreground italic">
        Tip: Catatan disimpan ketika Anda selesai mengetik atau mengklik di luar area teks.
      </p>
    </div>
  )
})

