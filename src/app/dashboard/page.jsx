import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Calculate leave quota
  // Default is 12 days. Subtract approved 'Tahunan' leaves for the current year.
  const currentYear = new Date().getFullYear()

  const { data: approvedLeaves } = await supabase
    .from('cuti')
    .select('dates')
    .eq('userid', user.id)
    .eq('category', 'Tahunan')
    .eq('status', 'acc')

  let daysTaken = 0
  if (approvedLeaves) {
    approvedLeaves.forEach(leave => {
      if (Array.isArray(leave.dates)) {
        // Filter dates that belong to the current year
        const datesInCurrentYear = leave.dates.filter(dateStr => {
          return dateStr.startsWith(`${currentYear}`)
        })
        daysTaken += datesInCurrentYear.length
      }
    })
  }

  const remainingQuota = 12 - daysTaken

  // Fetch recent leave history
  const { data: leaveHistory } = await supabase
    .from('cuti')
    .select('*')
    .eq('userid', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.username || user.email}!
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Annual Leave Quota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingQuota} Days</div>
            <p className="text-xs text-muted-foreground">
              Remaining for {currentYear}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Requests</h2>
          <Link href="/dashboard/form">
            <Button>Submit Leave</Button>
          </Link>
        </div>

        <div className="rounded-md border">
          {leaveHistory && leaveHistory.length > 0 ? (
            <div className="divide-y">
              {leaveHistory.map((leave) => (
                <div key={leave.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{leave.category}</p>
                    <DateDetailsModal dates={leave.dates}>
                      <button className="text-sm text-muted-foreground hover:text-primary hover:underline text-left">
                        {leave.dates && leave.dates.length > 0 ? (
                          leave.dates.length === 1 ? (
                            format(new Date(leave.dates[0]), "EEEE, d MMMM yyyy", { locale: id })
                          ) : (
                            `${format(new Date(leave.dates[0]), "d MMM yyyy", { locale: id })} - ${format(new Date(leave.dates[leave.dates.length - 1]), "d MMM yyyy", { locale: id })} (${leave.dates.length} hari)`
                          )
                        ) : (
                          format(new Date(leave.created_at), "d MMMM yyyy", { locale: id })
                        )}
                      </button>
                    </DateDetailsModal>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                      ${leave.status === 'acc' ? 'bg-green-100 text-green-800' :
                        leave.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No leave requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
