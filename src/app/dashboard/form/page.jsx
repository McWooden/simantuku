'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in.')
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

      const { error: insertError } = await supabase
        .from('cuti')
        .insert({
          userid: user.id,
          category,
          dates: formattedDates,
          note,
          status: 'pending'
        })

      if (insertError) {
        setError(insertError.message)
      } else {
        router.push('/dashboard')
        router.refresh() // Ensure dashboard picks up the new data
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" type="button" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
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

