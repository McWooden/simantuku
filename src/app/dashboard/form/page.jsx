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
import { generateLeavePDF, COORDS } from '@/lib/pdfGenerator'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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

  const [isAdmin, setIsAdmin] = useState(false)
  const [employeesList, setEmployeesList] = useState([])
  const [selectedOnBehalfId, setSelectedOnBehalfId] = useState('')
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState('')

  // Debounce dates for PDF preview
  useEffect(() => {
    setIsDatesApplying(true)
    const handler = setTimeout(() => {
      setDebouncedDates(dates)
      setIsDatesApplying(false)
    }, 1500)
    return () => clearTimeout(handler)
  }, [dates])

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
              .select('id, name, nip, position')
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

            if (employee.role === 'admin') {
              setIsAdmin(true)
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
          quotas,
          customCoords,
          atasan: superiors.find(s => s.id === atasanId),
          pejabat: superiors.find(s => s.id === pejabatId),
          recipientType,
          employeeStartDate
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
  }, [employeeId, employeeName, employeeNip, employeeUnit, employeePosition, employeePhone, address, category, debouncedDates, note, quotas, customCoords, atasanId, pejabatId, superiors, recipientType, employeeStartDate])

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
        status: isAdmin ? statusToSubmit : 'pending'
      }

      const res = await submitLeaveAction(payload);

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
                  <div className="space-y-4 bg-indigo-50/40 p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in duration-300 w-full overflow-hidden">
                    <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2 border-b border-indigo-100/60 pb-3">
                      <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span> Ajukan atas Nama Pegawai (Admin)
                    </h2>
                    <div className="space-y-2 w-full max-w-md">
                      <Label htmlFor="onBehalf" className="text-indigo-900 font-semibold">Pilih Pegawai</Label>
                      <Select value={selectedOnBehalfId || employeeId} onValueChange={handleSelectEmployee}>
                        <SelectTrigger id="onBehalf" className="h-11 bg-white border-indigo-200 w-full overflow-hidden">
                          <SelectValue placeholder="Pilih Pegawai" className="truncate" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                          {employeesList.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              <span className="truncate block max-w-[220px] xs:max-w-[280px] sm:max-w-sm md:max-w-md">
                                {emp.name} {emp.nip ? `(NIP: ${emp.nip})` : ''} {emp.id === loggedInEmployeeId ? ' — (Diri Sendiri)' : ''}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-indigo-700/80 font-medium">
                        *Sebagai Admin, Anda dapat mengirim formulir ini atas nama pegawai terpilih. Status pengajuan akan langsung disetujui (ACC).
                      </p>
                    </div>
                  </div>
                )}
                {/* Section 1: Informasi Dasar */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span> Informasi Dasar
                  </h2>

                  <div className="space-y-6">
                    <div className="space-y-3 max-w-md">
                      <Label htmlFor="category" className="text-slate-600 font-semibold">Kategori Cuti</Label>
                      <Select value={category} onValueChange={handleCategoryChange}>
                        <SelectTrigger id="category" className={`h-11 ${errors.category ? 'border-red-500 ring-red-500' : ''}`}>
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

                    {['Besar', 'Melahirkan', 'Penting', 'LuarTanggungan', 'Sakit'].includes(category) && (
                      <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-4 animate-in fade-in zoom-in duration-300">
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
                  </div>
                </div>

                {/* Section 2: Jadwal */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span> Jadwal Cuti
                    </h2>
                    {dates.length > 0 && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all self-start sm:self-auto ${isDatesApplying ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500 text-white shadow-sm'}`}>
                        {isDatesApplying && <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                        {dates.length} Hari Terpilih
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-start">
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
                    
                    <div className="mt-3 text-xs text-slate-500 font-medium space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100/80 animate-in fade-in duration-300">
                      <span className="block text-slate-700 font-semibold mb-1">Saldo Kuota Cuti Anda:</span>
                      <div className="flex flex-col xs:flex-row gap-2 xs:gap-5">
                        <span>Tahun Ini ({new Date().getFullYear()}): <strong className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{quotas.sisaN} hari</strong></span>
                        <span>Tahun Lalu ({new Date().getFullYear() - 1}): <strong className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{quotas.sisaN1} hari</strong></span>
                        <span>2 Tahun Lalu ({new Date().getFullYear() - 2}): <strong className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{quotas.sisaN2} hari</strong></span>
                      </div>
                    </div>

                    {dates.length === 0 && (
                      <p className="text-sm text-slate-500 mt-4 italic text-center w-full">
                        Harap pilih setidaknya satu tanggal dari kalender.
                      </p>
                    )}
                    {dates.some(d => d.getDay() === 0 || d.getDay() === 6) && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2 text-sm animate-in fade-in zoom-in duration-300 max-w-sm w-full">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5 text-amber-900">Peringatan Akhir Pekan!</strong>
                          <p className="opacity-90 leading-relaxed">
                            Anda memilih hari Sabtu atau Minggu. Hari kerja biasanya Senin hingga Jumat.
                          </p>
                        </div>
                      </div>
                    )}
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
                      <div className="flex flex-col gap-6 max-w-md w-full">
                        <div className="space-y-3 w-full">
                          <Label className="text-slate-600 font-semibold">Tujuan Surat Kepada Yth.</Label>
                          <div className="flex items-center gap-6 pt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 w-full">
                            <Label className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="radio"
                                name="recipientType"
                                value="Lurah"
                                checked={recipientType === 'Lurah'}
                                onChange={() => setRecipientType('Lurah')}
                                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary accent-primary"
                              />
                              <span>Lurah</span>
                            </Label>
                            <Label className="flex items-center gap-2 font-medium cursor-pointer">
                              <input
                                type="radio"
                                name="recipientType"
                                value="Camat"
                                checked={recipientType === 'Camat'}
                                onChange={() => setRecipientType('Camat')}
                                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary accent-primary"
                              />
                              <span>Camat</span>
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-4 w-full">
                          <div className="space-y-2 w-full">
                            <Label className="text-slate-600 font-semibold">Atasan Langsung</Label>
                            <Select value={atasanId} onValueChange={setAtasanId}>
                              <SelectTrigger className={`h-11 bg-white !w-full max-w-full overflow-hidden truncate ${errors.atasanId ? 'border-red-500 ring-red-500' : ''}`}>
                                <SelectValue placeholder="Pilih Atasan Langsung" className="truncate block max-w-[calc(100%-20px)]" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-3rem)] sm:max-w-md">
                                {superiors.length === 0 ? (
                                  <SelectItem value="empty" disabled>Tidak ada data atasan</SelectItem>
                                ) : (
                                  superiors.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                      <span className="truncate block max-w-[280px] sm:max-w-sm md:max-w-md">
                                        {s.name} - {s.position}
                                      </span>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2 w-full">
                            <Label className="text-slate-600 font-semibold">Pejabat Berwenang</Label>
                            <Select value={pejabatId} onValueChange={setPejabatId}>
                              <SelectTrigger className={`h-11 bg-white !w-full max-w-full overflow-hidden truncate ${errors.pejabatId ? 'border-red-500 ring-red-500' : ''}`}>
                                <SelectValue placeholder="Pilih Pejabat Berwenang" className="truncate block max-w-[calc(100%-20px)]" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-3rem)] sm:max-w-md">
                                {superiors.length === 0 ? (
                                  <SelectItem value="empty" disabled>Tidak ada data pejabat</SelectItem>
                                ) : (
                                  superiors.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                      <span className="truncate block max-w-[280px] sm:max-w-sm md:max-w-md">
                                        {s.name} - {s.position}
                                      </span>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
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
                      disabled={loading || checkingPending}
                      onClick={() => handleSubmit(null, 'pending')}
                    >
                      Kirim Permintaan
                    </Button>
                    <Button 
                      type="button" 
                      size="lg" 
                      className="min-w-[180px] shadow-sm rounded-full bg-primary hover:bg-primary/95 text-white" 
                      disabled={loading || checkingPending}
                      onClick={() => handleSubmit(null, 'acc')}
                    >
                      Kirim Permintaan & Setujui
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="min-w-[150px] shadow-sm rounded-full" 
                    disabled={loading || hasPending || checkingPending}
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
                <DownloadPdfButton pdfData={{ employeeId, name: employeeName, nip: employeeNip, unit: employeeUnit, position: employeePosition, phone: employeePhone, address, category, dates, note, quotas, customCoords, atasan: superiors.find(s => s.id === atasanId), pejabat: superiors.find(s => s.id === pejabatId), recipientType, employeeStartDate }} />
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

