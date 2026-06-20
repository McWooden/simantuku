'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitLeaveAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
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
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { generateLeavePDF, COORDS } from '@/lib/pdfGenerator'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LeaveFormPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [checkingPending, setCheckingPending] = useState(true)
  const [hasPending, setHasPending] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [employeeNip, setEmployeeNip] = useState('')
  const [employeeUnit, setEmployeeUnit] = useState('')
  const [employeePosition, setEmployeePosition] = useState('')
  const [employeePhone, setEmployeePhone] = useState('')
  const [employeeStartDate, setEmployeeStartDate] = useState(null)
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({
    category: false,
    dates: false,
    note: false,
    address: false,
    atasanId: false,
    pejabatId: false
  })
  const [quotas, setQuotas] = useState({ sisaN: 0, sisaN1: 0, sisaN2: 0 })
  const [nReducedSelected, setNReducedSelected] = useState(0)
  const [n1ReducedSelected, setN1ReducedSelected] = useState(0)
  const [n2ReducedSelected, setN2ReducedSelected] = useState(0)

  const [customCoords, setCustomCoords] = useState(COORDS)
  const [superiors, setSuperiors] = useState([])
  const [atasanId, setAtasanId] = useState('')
  const [pejabatId, setPejabatId] = useState('')
  const [dates, setDates] = useState([])
  const [debouncedDates, setDebouncedDates] = useState([])
  const [isDatesApplying, setIsDatesApplying] = useState(false)
  const [category, setCategory] = useState('Tahunan')
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [note, setNote] = useState('')
  const [recipientType, setRecipientType] = useState('Camat')

  const getTodayString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const [requestDate, setRequestDate] = useState(getTodayString())
  const [editingPart, setEditingPart] = useState(null) // null | 'day' | 'month' | 'year'
  const [tempDay, setTempDay] = useState('')
  const [tempYear, setTempYear] = useState('')

  const INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const parseDateString = (dateStr) => {
    if (!dateStr) return { day: 1, month: 0, year: new Date().getFullYear() }
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
        day: parseInt(parts[2], 10)
      }
    }
    const d = new Date(dateStr)
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() }
  }

  const formatDateString = (y, m, d) => {
    const yearStr = String(y).padStart(4, '0')
    const monthStr = String(m + 1).padStart(2, '0')
    const dayStr = String(d).padStart(2, '0')
    return `${yearStr}-${monthStr}-${dayStr}`
  }

  const getDaysInMonth = (y, m) => {
    return new Date(y, m + 1, 0).getDate()
  }

  const { year: parsedYear, month: parsedMonth, day: parsedDay } = parseDateString(requestDate)

  // Quota allocation logic
  const datesCount = dates.length
  const calcN = category === 'Tahunan' ? nReducedSelected : 0
  const calcN1 = category === 'Tahunan' ? n1ReducedSelected : 0
  const calcN2 = category === 'Tahunan' ? n2ReducedSelected : 0
  const totalAllocated = calcN + calcN1 + calcN2
  const totalAvailableQuota = quotas.sisaN + quotas.sisaN1 + quotas.sisaN2
  const isQuotaInsufficient = category === 'Tahunan' && dates.length > 0 && totalAvailableQuota < dates.length

  // Auto-allocate quotas using FIFO when dates or quotas change
  useEffect(() => {
    if (category === 'Tahunan') {
      let remaining = dates.length
      
      const defaultN2 = Math.min(remaining, quotas.sisaN2)
      remaining -= defaultN2
      
      const defaultN1 = Math.min(remaining, quotas.sisaN1)
      remaining -= defaultN1
      
      const defaultN = Math.min(remaining, quotas.sisaN)
      remaining -= defaultN

      setNReducedSelected(defaultN)
      setN1ReducedSelected(defaultN1)
      setN2ReducedSelected(defaultN2)
    } else {
      setNReducedSelected(0)
      setN1ReducedSelected(0)
      setN2ReducedSelected(0)
    }
  }, [dates.length, quotas, category])

  // Reset to default helper
  const handleResetAllocation = () => {
    let remaining = dates.length
    const defaultN2 = Math.min(remaining, quotas.sisaN2)
    remaining -= defaultN2
    const defaultN1 = Math.min(remaining, quotas.sisaN1)
    remaining -= defaultN1
    const defaultN = Math.min(remaining, quotas.sisaN)
    remaining -= defaultN

    setNReducedSelected(defaultN)
    setN1ReducedSelected(defaultN1)
    setN2ReducedSelected(defaultN2)
  }

  // Helper to dynamically adjust allocations when sliders change
  const changeAllocation = (part, val) => {
    let maxVal = 0
    if (part === 'N2') maxVal = quotas.sisaN2
    if (part === 'N1') maxVal = quotas.sisaN1
    if (part === 'N') maxVal = quotas.sisaN
    val = Math.max(0, Math.min(maxVal, val))

    let current = 0
    if (part === 'N2') current = n2ReducedSelected
    if (part === 'N1') current = n1ReducedSelected
    if (part === 'N') current = nReducedSelected

    const total = n2ReducedSelected + n1ReducedSelected + nReducedSelected

    if (total === dates.length) {
      if (val < current) {
        // Block manual reduction once target is met
        return
      }
      if (val > current) {
        let delta = val - current
        let otherParts = []
        if (part === 'N2') {
          otherParts = [
            { name: 'N', val: nReducedSelected, set: setNReducedSelected },
            { name: 'N1', val: n1ReducedSelected, set: setN1ReducedSelected }
          ]
        }
        if (part === 'N1') {
          otherParts = [
            { name: 'N', val: nReducedSelected, set: setNReducedSelected },
            { name: 'N2', val: n2ReducedSelected, set: setN2ReducedSelected }
          ]
        }
        if (part === 'N') {
          otherParts = [
            { name: 'N1', val: n1ReducedSelected, set: setN1ReducedSelected },
            { name: 'N2', val: n2ReducedSelected, set: setN2ReducedSelected }
          ]
        }

        // Try to deduct delta from other parts (newest/latest pool first)
        let p1 = otherParts[0]
        let p2 = otherParts[1]

        let deduct1 = Math.min(delta, p1.val)
        delta -= deduct1
        let deduct2 = Math.min(delta, p2.val)
        delta -= deduct2

        if (delta === 0) {
          if (part === 'N2') setN2ReducedSelected(val)
          if (part === 'N1') setN1ReducedSelected(val)
          if (part === 'N') setNReducedSelected(val)

          p1.set(p1.val - deduct1)
          p2.set(p2.val - deduct2)
        } else {
          // Cap the increase to available room
          const allowedIncrease = p1.val + p2.val
          const cappedVal = current + allowedIncrease
          if (part === 'N2') setN2ReducedSelected(cappedVal)
          if (part === 'N1') setN1ReducedSelected(cappedVal)
          if (part === 'N') setNReducedSelected(cappedVal)

          p1.set(0)
          p2.set(0)
        }
      }
    } else {
      // Under-allocated or over-allocated (e.g. date count changed), allow direct adjustment
      if (part === 'N2') setN2ReducedSelected(val)
      if (part === 'N1') setN1ReducedSelected(val)
      if (part === 'N') setNReducedSelected(val)
    }
  }

  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [employeesList, setEmployeesList] = useState([])
  const [selectedOnBehalfId, setSelectedOnBehalfId] = useState('')
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState('')
  const [showRedirectModal, setShowRedirectModal] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Countdown redirect effect
  useEffect(() => {
    if (!showRedirectModal) return

    if (countdown === 0) {
      router.push('/dashboard')
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [showRedirectModal, countdown, router])

  const pegawaiOptions = employeesList.map(emp => ({
    value: emp.id,
    label: `${emp.name}${emp.nip ? ` (NIP: ${emp.nip})` : ''}${emp.id === loggedInEmployeeId ? ' — (Diri Sendiri)' : ''}`
  }))

  const superiorOptions = superiors.map(s => ({
    value: s.id,
    label: `${s.name} - ${s.position}`
  }))

  // Debounce dates for PDF preview
  useEffect(() => {
    setIsDatesApplying(true)
    const handler = setTimeout(() => {
      setDebouncedDates(dates)
      setIsDatesApplying(false)
    }, 1500)
    return () => clearTimeout(handler)
  }, [dates])

  // Reset allocations when category or selected employee changes
  useEffect(() => {
    handleResetAllocation()
  }, [category, selectedOnBehalfId])

  // Check for pending requests on mount
  useEffect(() => {
    async function checkPending() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: employee } = await supabase.from('employees').select('id, name, nip, unit, position, phone_number, start_date, role').eq('auth_id', user.id).single()
          if (employee) {
            setEmployeeId(employee.id)
            setEmployeeName(employee.name)
            setEmployeeNip(employee.nip || '')
            setEmployeeUnit(employee.unit || '')
            setEmployeePosition(employee.position || '')
            setEmployeePhone(employee.phone_number || '')
            setEmployeeStartDate(employee.start_date || null)
            setLoggedInEmployeeId(employee.id)

            const { count } = await supabase.from('cuti').select('*', { count: 'exact', head: true }).eq('employee_id', employee.id).eq('status', 'pending')
            setHasPending(count > 0)

            const { data: superiorData, error: superiorError } = await supabase
              .from('employees')
              .select('id, name, nip, position, unit')
              .eq('is_superior', true)
              .order('name', { ascending: true })
            if (superiorData && !superiorError) {
              setSuperiors(superiorData)
            } else {
              console.warn("Could not load superiors, column might be missing:", superiorError?.message)
            }

            const { getLeaveQuotaOverviewAction } = await import('@/app/actions/leaveActions')
            const overview = await getLeaveQuotaOverviewAction(employee.id)
            const currentYear = new Date().getFullYear()
            const b = overview.buckets || []
            const sisaN = b.find(x => x.year === currentYear)?.remaining || 0
            const sisaN1 = b.find(x => x.year === currentYear - 1)?.remaining || 0
            const sisaN2 = b.find(x => x.year === currentYear - 2)?.remaining || 0
            setQuotas({ sisaN, sisaN1, sisaN2 })

            if (employee.role === 'admin' || employee.role === 'manager') {
              setIsAdmin(true)
              if (employee.role === 'manager') setIsManager(true)
              setSelectedOnBehalfId(employee.id)
              const { data: allEmployees, error: empError } = await supabase
                .from('employees')
                .select('id, name, nip, unit, position, phone_number, start_date')
                .order('name', { ascending: true })
              if (allEmployees && !empError) {
                setEmployeesList(allEmployees)
              }
            }
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

  const handleSelectEmployee = async (empId) => {
    const emp = employeesList.find(e => e.id === empId)
    if (!emp) return

    setSelectedOnBehalfId(empId)
    setEmployeeId(emp.id)
    setEmployeeName(emp.name)
    setEmployeeNip(emp.nip || '')
    setEmployeeUnit(emp.unit || '')
    setEmployeePosition(emp.position || '')
    setEmployeePhone(emp.phone_number || '')
    setEmployeeStartDate(emp.start_date || null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { count } = await supabase.from('cuti').select('*', { count: 'exact', head: true }).eq('employee_id', emp.id).eq('status', 'pending')
      setHasPending(count > 0)

      const { getLeaveQuotaOverviewAction } = await import('@/app/actions/leaveActions')
      const overview = await getLeaveQuotaOverviewAction(emp.id)
      const currentYear = new Date().getFullYear()
      const b = overview.buckets || []
      const sisaN = b.find(x => x.year === currentYear)?.remaining || 0
      const sisaN1 = b.find(x => x.year === currentYear - 1)?.remaining || 0
      const sisaN2 = b.find(x => x.year === currentYear - 2)?.remaining || 0
      setQuotas({ sisaN, sisaN1, sisaN2 })
    } catch (e) {
      console.error(e)
    }
  }

  const [showPreview, setShowPreview] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(null)

  // Live Preview effect
  useEffect(() => {
    let active = true
    const updatePreview = async () => {
      try {
        const blob = await generateLeavePDF({
          employeeId,
          name: employeeName,
          nip: employeeNip,
          unit: employeeUnit,
          position: employeePosition,
          phone: employeePhone,
          address,
          category,
          dates: debouncedDates,
          note,
          quotas: {
            sisaN: quotas.sisaN - calcN,
            sisaN1: quotas.sisaN1 - calcN1,
            sisaN2: quotas.sisaN2 - calcN2
          },
          customCoords,
          atasan: superiors.find(s => s.id === atasanId),
          pejabat: superiors.find(s => s.id === pejabatId),
          recipientType,
          employeeStartDate,
          requestDate
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
  }, [employeeId, employeeName, employeeNip, employeeUnit, employeePosition, employeePhone, address, category, debouncedDates, note, quotas, customCoords, atasanId, pejabatId, superiors, recipientType, employeeStartDate, calcN, calcN1, calcN2, requestDate])

  const handleCategoryChange = (val) => {
    setCategory(val)
  }

  const handleSubmit = async (e, statusToSubmit = 'pending') => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    const newErrors = {
      category: !category,
      dates: dates.length === 0,
      note: !note || !note.trim(),
      address: !address || !address.trim(),
      atasanId: !atasanId,
      pejabatId: !pejabatId
    }
    setErrors(newErrors)

    try {
      if (newErrors.category) {
        setError('Harap pilih kategori cuti.')
        setLoading(false)
        return
      }

      if (newErrors.dates) {
        setError('Harap pilih minimal satu tanggal cuti.')
        setLoading(false)
        return
      }

      if (newErrors.note) {
        setError('Harap isi Alasan / Catatan Cuti.')
        setLoading(false)
        return
      }

      if (newErrors.address) {
        setError('Harap isi Alamat Selama Cuti.')
        setLoading(false)
        return
      }

      if (newErrors.atasanId || newErrors.pejabatId) {
        setError('Harap pilih Atasan Langsung dan Pejabat Berwenang.')
        setLoading(false)
        return
      }

      let finalN = calcN;
      let finalN1 = calcN1;
      let finalN2 = calcN2;

      if (category === 'Tahunan' && totalAllocated !== dates.length) {
        let remaining = dates.length;
        
        finalN2 = Math.min(remaining, quotas.sisaN2);
        remaining -= finalN2;
        
        finalN1 = Math.min(remaining, quotas.sisaN1);
        remaining -= finalN1;
        
        finalN = Math.min(remaining, quotas.sisaN);
        remaining -= finalN;
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

      let attachmentUrl = null;
      if (attachmentFile) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${employeeId}-${Date.now()}.${fileExt}`;
        const filePath = `${category}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('leave_attachments')
          .upload(filePath, attachmentFile);

        if (uploadError) {
          setError(`Gagal mengunggah lampiran: ${uploadError.message}`);
          setLoading(false);
          return;
        }
        attachmentUrl = filePath;
      }

      const payload = {
        category,
        dates: formattedDates,
        note,
        address,
        recipientType,
        atasanId,
        pejabatId,
        attachmentUrl,
        onBehalfEmployeeId: isAdmin ? selectedOnBehalfId : null,
        status: isAdmin ? statusToSubmit : 'pending',
        n_reduced: finalN,
        n1_reduced: finalN1,
        n2_reduced: finalN2,
        requestDate
      }

      const res = await submitLeaveAction(payload);

      if (res?.error) {
        setError(res.error)
      } else {
        setShowRedirectModal(true)
        setCountdown(3)
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
              <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                Selesaikan langkah-langkah untuk mengirim formulir Anda
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="hidden lg:flex gap-2 shrink-0 ml-4 rounded-full shadow-sm">
              {showPreview ? <><EyeOff className="w-4 h-4" /> Sembunyikan Pratinjau</> : <><Eye className="w-4 h-4" /> Tampilkan Pratinjau</>}
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {hasPending && !isAdmin && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl flex gap-3 text-amber-800 shadow-sm mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-base">Akses Dibatasi</p>
                  <p className="mt-1">
                    Anda saat ini memiliki <strong>satu permintaan yang Menunggu (Pending)</strong>. Anda tidak dapat mengajukan permintaan baru sampai permintaan tersebut diproses (disetujui/ditolak) atau Anda menghapusnya sendiri di halaman Dashboard. <Link href="/dashboard#recent-requests" className="text-blue-600 hover:text-blue-800 underline font-medium">Hapus disini.</Link>
                  </p>
                </div>
              </div>
            )}

            <div className={`space-y-6 ${(hasPending && !isAdmin) ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

              <div className="flex flex-col space-y-12 pt-2">
                {isAdmin && (
                  <div className="space-y-4 bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in duration-300 w-full">
                    <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2 border-b border-indigo-100/60 pb-3">
                      <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span> Ajukan atas Nama Pegawai (Admin)
                    </h2>
                    <div className="space-y-2 w-full max-w-md">
                      <Label htmlFor="onBehalf" className="text-indigo-900 font-semibold">Pilih Pegawai</Label>
                      <SearchableSelect
                        value={selectedOnBehalfId || employeeId}
                        onChange={handleSelectEmployee}
                        options={pegawaiOptions}
                        placeholder="Pilih Pegawai"
                        searchPlaceholder="Cari pegawai..."
                      />
                      <p className="text-xs text-indigo-700/80 font-medium">
                        *Sebagai Admin, Anda dapat mengirim formulir ini atas nama pegawai terpilih. Status pengajuan akan langsung disetujui (ACC).
                      </p>
                    </div>
                  </div>
                )}
                {/* Header-like Right-aligned controls (Date and Recipient) */}
                <div className="flex flex-col items-end gap-2 text-right w-full mb-4">
                  {/* Request Date */}
                  <div className="h-9 flex items-center text-slate-800 text-base font-normal gap-1.5 select-none justify-end">
                    <span>Magelang,</span>

                    {/* Day */}
                    {editingPart === 'day' ? (
                      <input
                        type="number"
                        min={1}
                        max={getDaysInMonth(parsedYear, parsedMonth)}
                        value={tempDay}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setTempDay(isNaN(val) ? '' : val)
                        }}
                        onBlur={() => {
                          const cleanDay = Math.max(1, Math.min(getDaysInMonth(parsedYear, parsedMonth), tempDay || 1))
                          const newDateStr = formatDateString(parsedYear, parsedMonth, cleanDay)
                          setRequestDate(newDateStr)
                          setEditingPart(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const cleanDay = Math.max(1, Math.min(getDaysInMonth(parsedYear, parsedMonth), tempDay || 1))
                            const newDateStr = formatDateString(parsedYear, parsedMonth, cleanDay)
                            setRequestDate(newDateStr)
                            setEditingPart(null)
                          } else if (e.key === 'Escape') {
                            setEditingPart(null)
                          }
                        }}
                        autoFocus
                        className="w-12 h-7 px-1 text-center border border-slate-300 rounded font-normal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-base"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setTempDay(parsedDay)
                          setEditingPart('day')
                        }}
                        className="cursor-pointer font-normal text-slate-800 hover:text-primary transition-colors"
                        style={{
                          backgroundImage: 'linear-gradient(to right, var(--color-primary, #6366f1) 60%, transparent 60%)',
                          backgroundPosition: '0 100%',
                          backgroundSize: '5px 1.2px',
                          backgroundRepeat: 'repeat-x',
                          paddingBottom: '1px',
                        }}
                        title="Klik untuk mengubah hari"
                      >
                        {parsedDay}
                      </span>
                    )}

                    {/* Month */}
                    <div className="relative inline-block text-left">
                      <span
                        onClick={() => setEditingPart(editingPart === 'month' ? null : 'month')}
                        className="cursor-pointer font-normal text-slate-800 hover:text-primary transition-colors"
                        style={{
                          backgroundImage: 'linear-gradient(to right, var(--color-primary, #6366f1) 60%, transparent 60%)',
                          backgroundPosition: '0 100%',
                          backgroundSize: '5px 1.2px',
                          backgroundRepeat: 'repeat-x',
                          paddingBottom: '1px',
                        }}
                        title="Klik untuk mengubah bulan"
                      >
                        {INDONESIAN_MONTHS[parsedMonth]}
                      </span>
                      {editingPart === 'month' && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setEditingPart(null)}
                          />
                          <div className="absolute right-0 mt-1 max-h-60 w-40 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-1 duration-100 border border-slate-200">
                            {INDONESIAN_MONTHS.map((m, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 hover:text-slate-900 transition-colors ${parsedMonth === idx ? 'bg-indigo-50 text-primary font-medium' : 'text-slate-700'}`}
                                onClick={() => {
                                  const maxDays = getDaysInMonth(parsedYear, idx)
                                  const cleanDay = Math.min(parsedDay, maxDays)
                                  const newDateStr = formatDateString(parsedYear, idx, cleanDay)
                                  setRequestDate(newDateStr)
                                  setEditingPart(null)
                                }}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Year */}
                    {editingPart === 'year' ? (
                      <input
                        type="number"
                        min={1900}
                        max={2100}
                        value={tempYear}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10)
                          setTempYear(isNaN(val) ? '' : val)
                        }}
                        onBlur={() => {
                          const cleanYear = Math.max(1900, Math.min(2100, tempYear || new Date().getFullYear()))
                          const maxDays = getDaysInMonth(cleanYear, parsedMonth)
                          const cleanDay = Math.min(parsedDay, maxDays)
                          const newDateStr = formatDateString(cleanYear, parsedMonth, cleanDay)
                          setRequestDate(newDateStr)
                          setEditingPart(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const cleanYear = Math.max(1900, Math.min(2100, tempYear || new Date().getFullYear()))
                            const maxDays = getDaysInMonth(cleanYear, parsedMonth)
                            const cleanDay = Math.min(parsedDay, maxDays)
                            const newDateStr = formatDateString(cleanYear, parsedMonth, cleanDay)
                            setRequestDate(newDateStr)
                            setEditingPart(null)
                          } else if (e.key === 'Escape') {
                            setEditingPart(null)
                          }
                        }}
                        autoFocus
                        className="w-16 h-7 px-1 text-center border border-slate-300 rounded font-normal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-base"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setTempYear(parsedYear)
                          setEditingPart('year')
                        }}
                        className="cursor-pointer font-normal text-slate-800 hover:text-primary transition-colors"
                        style={{
                          backgroundImage: 'linear-gradient(to right, var(--color-primary, #6366f1) 60%, transparent 60%)',
                          backgroundPosition: '0 100%',
                          backgroundSize: '5px 1.2px',
                          backgroundRepeat: 'repeat-x',
                          paddingBottom: '1px',
                        }}
                        title="Klik untuk mengubah tahun"
                      >
                        {parsedYear}
                      </span>
                    )}
                  </div>

                  {/* Recipient */}
                  <div className="flex flex-col items-end gap-1">
                    <Label className="text-slate-500 font-semibold text-xs tracking-wider uppercase text-right">Tujuan Surat Kepada Yth.</Label>
                    <div className="flex items-center gap-4 h-9 px-3 bg-slate-50 rounded-lg border border-slate-200/85 w-fit">
                      <Label className="flex items-center gap-1.5 font-medium cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="recipientType"
                          value="Lurah"
                          checked={recipientType === 'Lurah'}
                          onChange={() => setRecipientType('Lurah')}
                          className="w-3.5 h-3.5 text-primary border-slate-300 focus:ring-primary accent-primary"
                        />
                        <span>Lurah</span>
                      </Label>
                      <Label className="flex items-center gap-1.5 font-medium cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="recipientType"
                          value="Camat"
                          checked={recipientType === 'Camat'}
                          onChange={() => setRecipientType('Camat')}
                          className="w-3.5 h-3.5 text-primary border-slate-300 focus:ring-primary accent-primary"
                        />
                        <span>Camat</span>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Section 2: Jadwal Cuti (Kategori Terintegrasi) */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="w-1.5 h-6 bg-indigo-500 rounded-full shrink-0"></span>
                      <span>Jadwal Cuti</span>
                      <Select value={category} onValueChange={handleCategoryChange}>
                        <SelectTrigger
                          id="category"
                          className="h-auto p-0 border-0 bg-transparent hover:bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 text-left font-bold text-slate-800 text-xl cursor-pointer inline-flex items-center gap-1 w-fit focus:outline-none rounded-none"
                          style={{
                            backgroundImage: 'linear-gradient(to right, var(--color-primary, #6366f1) 60%, transparent 60%)',
                            backgroundPosition: '0 100%',
                            backgroundSize: '5px 1.5px',
                            backgroundRepeat: 'repeat-x',
                            paddingBottom: '2px',
                          }}
                        >
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent className="font-normal font-sans">
                          <SelectItem value="Tahunan">Tahunan</SelectItem>
                          <SelectItem value="Besar">Besar</SelectItem>
                          <SelectItem value="Sakit">Sakit</SelectItem>
                          <SelectItem value="Melahirkan">Melahirkan</SelectItem>
                          <SelectItem value="Penting">Karena Alasan Penting</SelectItem>
                          <SelectItem value="LuarTanggungan">di Luar Tanggungan Negara</SelectItem>
                        </SelectContent>
                      </Select>
                    </h2>
                    {dates.length > 0 && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all self-start sm:self-auto ${isDatesApplying ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500 text-white shadow-sm'}`}>
                        {isDatesApplying && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                        {dates.length} Hari Terpilih
                      </span>
                    )}
                  </div>

                  {['Besar', 'Melahirkan', 'Penting', 'LuarTanggungan', 'Sakit'].includes(category) && (
                    <div className="max-w-md p-5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-4 animate-in fade-in zoom-in duration-300">
                      <Label htmlFor="attachment" className="font-semibold text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Dokumen Pendukung (Opsional)
                      </Label>
                      <Input
                        id="attachment"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              setError('File lampiran harus berformat PDF.');
                              e.target.value = '';
                              setAttachmentFile(null);
                              setAttachmentPreview(null);
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              setError('Ukuran file lampiran maksimal 5MB.');
                              e.target.value = '';
                              setAttachmentFile(null);
                              setAttachmentPreview(null);
                              return;
                            }
                            setError('');
                            setAttachmentFile(file);
                            setAttachmentPreview(URL.createObjectURL(file));
                          } else {
                            setAttachmentFile(null);
                            setAttachmentPreview(null);
                          }
                        }}
                        className="cursor-pointer file:cursor-pointer bg-white"
                      />
                      <p className="text-xs text-amber-700/80 font-medium">
                        *Cuti Sakit, Besar, Melahirkan, Penting, atau Di Luar Tanggungan Negara biasanya memerlukan surat pendukung (Maks. 5MB, berformat PDF).
                      </p>

                      {attachmentPreview && (
                        <div className="mt-4 border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm">
                          <div className="bg-slate-50 px-3 py-2 border-b text-xs font-semibold text-slate-700 flex justify-between items-center">
                            <span className="truncate pr-4">Pratinjau: {attachmentFile?.name}</span>
                            <span className="text-slate-500 whitespace-nowrap">{(attachmentFile?.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <iframe
                            src={attachmentPreview}
                            className="w-full h-80 border-0"
                            title="Pratinjau Lampiran"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-row flex-wrap gap-6 items-start w-full">
                    {/* Calendar Column */}
                    <div className="flex flex-col items-start shrink-0">
                      <div className={`bg-white rounded-xl border ${errors.dates ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'} shadow-sm p-3 inline-block transition-colors`}>
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
                        <p className="text-sm text-slate-500 mt-4 italic text-center w-full max-w-[270px]">
                          Harap pilih setidaknya satu tanggal dari kalender.
                        </p>
                      )}
                      
                      {dates.some(d => d.getDay() === 0 || d.getDay() === 6) && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2 text-sm animate-in fade-in zoom-in duration-300 max-w-[270px]">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="block mb-0.5 text-amber-900">Peringatan Akhir Pekan!</strong>
                            <p className="opacity-90 leading-relaxed text-xs">
                              Anda memilih hari Sabtu atau Minggu. Hari kerja biasanya Senin hingga Jumat.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unified Quota & Allocation Card Column */}
                    {dates.length > 0 && (
                      <div className="flex-1 w-full max-w-sm bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 animate-in fade-in duration-300">
                        {/* Title & Quota Balance Cards */}
                        <div className="space-y-2">
                          <span className="block text-slate-700 font-bold text-xs uppercase tracking-wider">Saldo Kuota Cuti</span>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">{new Date().getFullYear()}</span>
                              <span className="block text-base font-extrabold text-slate-800">{quotas.sisaN}</span>
                              <span className="block text-[8px] text-slate-500">Sisa (N)</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">{new Date().getFullYear() - 1}</span>
                              <span className="block text-base font-extrabold text-slate-800">{quotas.sisaN1}</span>
                              <span className="block text-[8px] text-slate-500">Sisa (N-1)</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">{new Date().getFullYear() - 2}</span>
                              <span className="block text-base font-extrabold text-slate-800">{quotas.sisaN2}</span>
                              <span className="block text-[8px] text-slate-500">Sisa (N-2)</span>
                            </div>
                          </div>
                        </div>

                        {/* Allocation section (only for Tahunan) */}
                        {category === 'Tahunan' && (
                          <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                Alokasi Potongan Kuota ({dates.length} Hari)
                              </h3>
                            </div>

                            {/* Insufficient Quota warning */}
                            {isQuotaInsufficient ? (
                              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs space-y-1 animate-in slide-in-from-top-2 duration-300">
                                <p className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-red-600" /> Kuota Tidak Cukup!</p>
                                <p className="opacity-90 leading-relaxed font-medium">
                                  Dibutuhkan {dates.length} hari, tetapi total sisa kuota hanya {totalAvailableQuota} hari.
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* Row sliders (compact layout) */}
                                <div className="space-y-3">
                                  {/* Slider N-2 */}
                                  {quotas.sisaN2 > 0 && (
                                    <div className="flex items-center justify-between gap-3 text-xs w-full">
                                      {/* Left: Year only */}
                                      <span className="font-bold text-slate-800 w-12 shrink-0 text-left">
                                        {new Date().getFullYear() - 2}
                                      </span>
                                      {/* Center: Slider & Buttons */}
                                      <div className="flex-1 flex items-center gap-1 min-w-0">
                                        <button
                                          type="button"
                                          disabled={n2ReducedSelected <= 0 || totalAllocated === dates.length}
                                          onClick={() => changeAllocation('N2', n2ReducedSelected - 1)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-xs"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="range"
                                          min="0"
                                          max={quotas.sisaN2}
                                          value={n2ReducedSelected}
                                          onChange={(e) => changeAllocation('N2', parseInt(e.target.value, 10) || 0)}
                                          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          disabled={n2ReducedSelected >= quotas.sisaN2 || (totalAllocated === dates.length && n1ReducedSelected === 0 && nReducedSelected === 0)}
                                          onClick={() => changeAllocation('N2', n2ReducedSelected + 1)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-xs"
                                        >
                                          +
                                        </button>
                                      </div>
                                      {/* Right: Selected Days */}
                                      <span className="font-bold text-slate-800 w-11 shrink-0 text-right">
                                        {n2ReducedSelected} hari
                                      </span>
                                    </div>
                                  )}

                                  {/* Slider N-1 */}
                                  {quotas.sisaN1 > 0 && (
                                    <div className="flex items-center justify-between gap-3 text-xs w-full">
                                      {/* Left: Year only */}
                                      <span className="font-bold text-slate-800 w-12 shrink-0 text-left">
                                        {new Date().getFullYear() - 1}
                                      </span>
                                      {/* Center: Slider & Buttons */}
                                      <div className="flex-1 flex items-center gap-1 min-w-0">
                                        <button
                                          type="button"
                                          disabled={n1ReducedSelected <= 0 || totalAllocated === dates.length}
                                          onClick={() => changeAllocation('N1', n1ReducedSelected - 1)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-xs"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="range"
                                          min="0"
                                          max={quotas.sisaN1}
                                          value={n1ReducedSelected}
                                          onChange={(e) => changeAllocation('N1', parseInt(e.target.value, 10) || 0)}
                                          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          disabled={n1ReducedSelected >= quotas.sisaN1 || (totalAllocated === dates.length && n2ReducedSelected === 0 && nReducedSelected === 0)}
                                          onClick={() => changeAllocation('N1', n1ReducedSelected + 1)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-xs"
                                        >
                                          +
                                        </button>
                                      </div>
                                      {/* Right: Selected Days */}
                                      <span className="font-bold text-slate-800 w-11 shrink-0 text-right">
                                        {n1ReducedSelected} hari
                                      </span>
                                    </div>
                                  )}

                                  {/* Slider N */}
                                  {quotas.sisaN > 0 && (
                                    <div className="flex items-center justify-between gap-3 text-xs w-full">
                                      {/* Left: Year only */}
                                      <span className="font-bold text-slate-800 w-12 shrink-0 text-left">
                                        {new Date().getFullYear()}
                                      </span>
                                      {/* Center: Slider & Buttons */}
                                      <div className="flex-1 flex items-center gap-1 min-w-0">
                                        <button
                                          type="button"
                                          disabled={nReducedSelected <= 0 || totalAllocated === dates.length}
                                          onClick={() => changeAllocation('N', nReducedSelected - 1)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-xs"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="range"
                                          min="0"
                                          max={quotas.sisaN}
                                          value={nReducedSelected}
                                          onChange={(e) => changeAllocation('N', parseInt(e.target.value, 10) || 0)}
                                          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          disabled={nReducedSelected >= quotas.sisaN || (totalAllocated === dates.length && n2ReducedSelected === 0 && n1ReducedSelected === 0)}
                                          onClick={() => changeAllocation('N', nReducedSelected + 1)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed select-none font-bold text-xs"
                                        >
                                          +
                                        </button>
                                      </div>
                                      {/* Right: Selected Days */}
                                      <span className="font-bold text-slate-800 w-11 shrink-0 text-right">
                                        {nReducedSelected} hari
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {totalAllocated !== dates.length && (
                                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200">
                                    <button
                                      type="button"
                                      onClick={handleResetAllocation}
                                      className="text-primary hover:underline font-bold text-[10px] inline-block text-left"
                                    >
                                      Auto-Alokasikan (FIFO)
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) }
                  </div>
                </div>

                {/* Section 3: Detail & Persetujuan */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> Detail & Persetujuan
                  </h2>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <DebouncedTextarea
                        id="address"
                        label="Alamat Selama Cuti"
                        placeholder="Contoh: Jl. Merdeka No. 123..."
                        value={address}
                        onChange={setAddress}
                        maxLength={52}
                        hasError={errors.address}
                      />
                      <DebouncedTextarea
                        id="note"
                        label="Alasan / Catatan"
                        placeholder="Jelaskan secara singkat..."
                        value={note}
                        onChange={setNote}
                        maxLength={247}
                        hasError={errors.note}
                      />
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <div className="flex flex-col gap-4 max-w-md w-full">
                        <div className="space-y-2 w-full">
                          <Label className="text-slate-600 font-semibold">Atasan Langsung</Label>
                          <SearchableSelect
                            value={atasanId}
                            onChange={setAtasanId}
                            options={superiorOptions}
                            placeholder="Pilih Atasan Langsung"
                            searchPlaceholder="Cari atasan langsung..."
                            className={errors.atasanId ? 'border-red-500 ring-red-500' : ''}
                          />
                        </div>
                        
                        <div className="space-y-2 w-full">
                          <Label className="text-slate-650 font-semibold">Pejabat Berwenang</Label>
                          <SearchableSelect
                            value={pejabatId}
                            onChange={setPejabatId}
                            options={superiorOptions}
                            placeholder="Pilih Pejabat Berwenang"
                            searchPlaceholder="Cari pejabat berwenang..."
                            className={errors.pejabatId ? 'border-red-500 ring-red-500' : ''}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 font-medium">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button variant="ghost" type="button" onClick={() => router.push('/dashboard')}>
                  Batal
                </Button>
                {isAdmin ? (
                  <>
                    <Button 
                      type="button" 
                      variant="outline"
                      size="lg" 
                      className="min-w-[150px] shadow-sm rounded-full" 
                      disabled={loading || checkingPending || isQuotaInsufficient}
                      onClick={() => handleSubmit(null, 'pending')}
                    >
                      Kirim Permintaan
                    </Button>
                    {isManager && (
                      <Button 
                        type="button" 
                        size="lg" 
                        className="min-w-[180px] shadow-sm rounded-full bg-primary hover:bg-primary/95 text-white" 
                        disabled={loading || checkingPending || isQuotaInsufficient}
                        onClick={() => handleSubmit(null, 'acc')}
                      >
                        Kirim Permintaan & Setujui
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="min-w-[150px] shadow-sm rounded-full" 
                    disabled={loading || hasPending || checkingPending || isQuotaInsufficient}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Mengirim...' : hasPending ? 'Permintaan Diblokir' : 'Kirim Permintaan'}
                  </Button>
                )}
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
                 <DownloadPdfButton pdfData={{ employeeId, name: employeeName, nip: employeeNip, unit: employeeUnit, position: employeePosition, phone: employeePhone, address, category, dates, note, quotas: { sisaN: quotas.sisaN - calcN, sisaN1: quotas.sisaN1 - calcN1, sisaN2: quotas.sisaN2 - calcN2 }, customCoords, atasan: superiors.find(s => s.id === atasanId), pejabat: superiors.find(s => s.id === pejabatId), recipientType, employeeStartDate, requestDate }} />
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

          </div>
        )}

      </div>

      {/* Redirect Countdown Modal */}
      <Dialog open={showRedirectModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&>button]:hidden flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-slate-100 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold text-slate-800 text-center">Permohonan Berhasil Dikirim!</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm text-center">
              Dokumen pengajuan cuti Anda telah berhasil dibuat dan dikirim ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg border border-primary/20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/20 opacity-75"></span>
              {countdown}
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-2 tracking-wide">
              Mengalihkan ke Dashboard...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


const DebouncedTextarea = memo(function DebouncedTextarea({ id, label, placeholder, value, onChange, maxLength, tip, hasError }) {
  const [innerValue, setInnerValue] = useState(value)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (value !== innerValue) {
      setInnerValue(value)
    }
  }, [value])

  const handleChange = (e) => {
    setInnerValue(e.target.value)
    setStatus('typing')
  }

  useEffect(() => {
    if (status !== 'typing') return;
    const handler = setTimeout(() => {
      setStatus('applying')
      onChange(innerValue)
      setTimeout(() => setStatus('idle'), 1000)
    }, 2000) // 2 second debounce
    return () => clearTimeout(handler)
  }, [innerValue, status, onChange])

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={id}>{label}</Label>
        {status === 'typing' && (
          <span className="text-[10px] font-medium text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Menunggu...
          </span>
        )}
        {status === 'applying' && (
          <span className="text-[10px] font-medium text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
            <div className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Menerapkan...
          </span>
        )}
      </div>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={innerValue}
        onChange={handleChange}
        maxLength={maxLength}
        className={hasError ? 'border-red-500 ring-red-500' : ''}
      />
      {tip && (
        <p className="text-[10px] text-muted-foreground italic">
          {tip}
        </p>
      )}
    </div>
  )
})

