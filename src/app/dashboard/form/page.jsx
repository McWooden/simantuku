'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
import { memo } from 'react'
import { DownloadPdfButton } from '@/components/ui/DownloadPdfButton'
import { generateLeavePDF } from '@/lib/pdfGenerator'
import { Eye, EyeOff } from 'lucide-react'

export default function LeaveFormPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [checkingPending, setCheckingPending] = useState(true)
  const [hasPending, setHasPending] = useState(false)
  const [employeeName, setEmployeeName] = useState('')
  const [error, setError] = useState('')

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
          note
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
  }, [employeeName, category, dates, note])

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {showPreview && (
          <Card className="w-full lg:w-[55%] h-[800px] flex flex-col sticky top-6">
            <CardHeader className="py-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Live Document Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="lg:hidden text-xs">
                Close Preview
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-slate-100 relative">
              {pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none rounded-b-xl"
                  title="PDF Preview"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <p>Generating preview...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={`transition-all duration-300 w-full ${showPreview ? 'lg:w-[45%]' : 'lg:max-w-2xl lg:mx-auto'}`}>
          <form onSubmit={handleSubmit}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Request Leave</CardTitle>
                <CardDescription>
                  Submit a new leave request. Please select all the individual dates you plan to take off.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="hidden lg:flex gap-2 shrink-0 ml-4">
                {showPreview ? <><EyeOff className="w-4 h-4" /> Hide Preview</> : <><Eye className="w-4 h-4" /> Show Preview</>}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 mb-6">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">Access Restricted</p>
                    <p>You currently have a **Pending** request. You cannot submit a new one until your current request is approved, rejected, or cancelled.</p>
                  </div>
                </div>
              )}

              <div className={`space-y-6 ${hasPending ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">

                  <div className="space-y-2">
                    <Label htmlFor="category">Leave Category</Label>
                    <Select value={category} onValueChange={handleCategoryChange}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
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
                    {category ? (
                      <div className="mt-4 p-3 bg-white rounded-md border border-dashed flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="text-sm text-muted-foreground italic flex-1">
                          View or download your filled template.
                        </div>
                        <DownloadPdfButton employeeName={employeeName} leave={{ category, dates, note }} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        * Selecting a category will allow you to generate the required PDF template.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Dates</Label>
                  <div className="border rounded-md p-2 flex justify-center">
                    <Calendar
                      mode="multiple"
                      selected={dates}
                      onSelect={setDates}
                      className="rounded-md"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You have selected {dates.length} day(s).
                  </p>
                </div>

                <NoteInput value={note} onChange={setNote} />

                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={() => router.push('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || hasPending || checkingPending}>
                {loading ? 'Submitting...' : hasPending ? 'Request Blocked' : 'Submit Request'}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  )
}


const NoteInput = memo(function NoteInput({ value, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="note">Notes / Reason (Optional)</Label>
      <Textarea
        id="note"
        placeholder="Briefly explain the reason for your leave..."
        defaultValue={value}
        maxLength={247}
        onBlur={(e) => onChange(e.target.value)}
      />
      <p className="text-[10px] text-muted-foreground italic">
        Tip: Notes are saved when you finish typing or click away.
      </p>
    </div>
  )
})

