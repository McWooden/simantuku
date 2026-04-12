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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { memo } from 'react'

export default function LeaveFormPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [checkingPending, setCheckingPending] = useState(true)
  const [hasPending, setHasPending] = useState(false)
  const [error, setError] = useState('')

  // Check for pending requests on mount
  useEffect(() => {
    async function checkPending() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: employee } = await supabase.from('employees').select('id').eq('auth_id', user.id).single()
          if (employee) {
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
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [alreadyHaveFile, setAlreadyHaveFile] = useState(false)

  const handleCategoryChange = (val) => {
    setCategory(val)

    // Only trigger download if category is selected and user hasn't opted out
    if (!alreadyHaveFile && val) {
      const link = document.createElement('a')
      link.href = `/templates/${val}.pdf`
      link.download = `${val}_Template.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
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
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Request Leave</CardTitle>
            <CardDescription>
              Submit a new leave request. Please select all the individual dates you plan to take off.
            </CardDescription>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alreadyHaveFile"
                  checked={alreadyHaveFile}
                  onCheckedChange={setAlreadyHaveFile}
                />
                <Label
                  htmlFor="alreadyHaveFile"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I already have the template / file
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Leave Category</Label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tahunan">Tahunan (Annual Leave)</SelectItem>
                    <SelectItem value="Sakit">Sakit (Sick Leave)</SelectItem>
                    <SelectItem value="Melahirkan">Melahirkan (Maternity Leave)</SelectItem>
                    <SelectItem value="Penting">Penting (Important Leave)</SelectItem>
                  </SelectContent>
                </Select>
                {!alreadyHaveFile && (
                  <p className="text-xs text-muted-foreground italic">
                    * Selecting a category will automatically download the required PDF template.
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
        onBlur={(e) => onChange(e.target.value)}
      />
      <p className="text-[10px] text-muted-foreground italic">
        Tip: Notes are saved when you finish typing or click away.
      </p>
    </div>
  )
})

