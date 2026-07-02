'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { useState, useEffect } from 'react'

export function DateDetailsModal({ dates, children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert string dates back to Date objects for the calendar
  const sortedDates = [...dates].sort((a, b) => new Date(a) - new Date(b))
  const firstDateFormatted = sortedDates.length > 0 
    ? format(new Date(sortedDates[0]), "d MMM yyyy", { locale: id })
    : "-"
  const dateObjects = dates.map(d => new Date(d))

  if (!mounted) {
    return children || (
      <button className="flex items-center gap-2 text-primary hover:underline group" type="button">
        <CalendarIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span>{firstDateFormatted}</span>
      </button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button className="flex items-center gap-2 text-primary hover:underline group" type="button">
            <CalendarIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>{firstDateFormatted}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Requested Leave Dates</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="border rounded-md p-2 bg-muted/30 flex justify-center">
            <Calendar
              mode="multiple"
              selected={dateObjects}
              className="pointer-events-none" // Read-only calendar
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none">Full Date List</h4>
            <div className="max-h-[150px] overflow-y-auto rounded-md border p-2 bg-background space-y-1">
              {dateObjects.map((date, i) => (
                <div key={i} className="text-sm py-1 border-b last:border-0">
                  {format(date, "EEEE, d MMMM yyyy", { locale: id })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
