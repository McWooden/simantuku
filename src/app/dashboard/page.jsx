import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'
import { CalendarDays, PlusCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { CancelLeaveButton } from './CancelLeaveButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Official Employee profile
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!employee) {
    redirect('/pending')
  }

  // Calculate leave quota using the new advanced bucket logic
  const { getLeaveQuotaOverviewAction } = await import('@/app/actions/leaveActions')
  const quotaOverview = await getLeaveQuotaOverviewAction(employee.id)
  const remainingQuota = quotaOverview.totalRemaining
  const totalAllowed = quotaOverview.totalAllowed
  const progressPercent = quotaOverview.progressPercent
  const buckets = quotaOverview.buckets || []
  const currentYear = new Date().getFullYear();

  // Fetch recent leave history
  const { data: leaveHistory } = await supabase
    .from('cuti')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const hasPending = leaveHistory?.some(l => l.status === 'pending');

  return (
    <div className="space-y-8 pt-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-600 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-primary-foreground/80 font-medium mb-1">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Welcome back, {employee.name}!
          </h1>
          <p className="text-primary-foreground/90 max-w-md">
            Here is an overview of your current leave balances and recent requests.
          </p>
        </div>
        {/* Abstract shapes for background */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-32 translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-xl" />
      </div>

      {hasPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-2 bg-amber-100 rounded-full">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold">Pending Request in Progress</h4>
            <p className="text-sm opacity-90">You currently have a request awaiting approval. You won't be able to submit a new one until this is resolved or cancelled.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Advanced Quota Card */}
        <Card className="col-span-1 border-none shadow-md bg-white overflow-hidden relative group hover:shadow-xl transition-all duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Annual Leave Quota</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-primary tracking-tighter">
                    {remainingQuota}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground mb-1">
                    / {totalAllowed}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>
            
            <div className="mt-6 w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Quota Breakdown</p>
              {buckets.slice().reverse().map((bucket) => (
                <div key={bucket.year} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">
                      Year {bucket.year} 
                      {bucket.year === currentYear ? (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">Current</span>
                      ) : bucket.year === currentYear - 1 ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1 text-[9px]">Last Year</span>
                      ) : bucket.year === currentYear - 2 ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1 text-[9px]">2 Years Ago</span>
                      ) : null}
                    </span>
                    {bucket.expires_at && (
                      <span className="text-[10px] text-muted-foreground">Expires {format(new Date(bucket.expires_at), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{bucket.remaining}</span>
                    <span className="text-slate-400"> / {bucket.total} d</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground mt-4 italic">
              * Quota prioritizes using the oldest expiring days first.
            </p>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="md:col-span-2 border-none shadow-md bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-violet-100 rounded-full blur-2xl transition-transform group-hover:scale-125" />
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-bold">Planning time off?</h3>
              <p className="text-sm text-muted-foreground">
                Submit a new leave request. Our system will automatically process and notify your administrators.
              </p>
            </div>
            <Button size="lg" className="rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all px-8" asChild>
              <Link href="/dashboard/form">
                <PlusCircle className="mr-2 h-5 w-5" /> Request Leave
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Recent Requests</h2>

        <div className="flex flex-col gap-3">
          {leaveHistory && leaveHistory.length > 0 ? (
            leaveHistory.map((leave) => {
              const isAcc = leave.status === 'acc';
              const isRejected = leave.status === 'ditolak';
              
              return (
                <div 
                  key={leave.id} 
                  className="bg-white rounded-xl shadow-sm border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex items-center p-0 relative"
                >
                  <div className={`w-2 h-full absolute left-0 top-0 bottom-0 ${
                    isAcc ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-400'
                  }`} />
                  
                  <div className="flex-1 p-5 pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-full mt-1 sm:mt-0 ${
                        isAcc ? 'bg-emerald-100 text-emerald-600' : 
                        isRejected ? 'bg-red-100 text-red-600' : 
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {isAcc ? <CheckCircle2 className="w-5 h-5" /> : 
                         isRejected ? <AlertCircle className="w-5 h-5" /> : 
                         <Clock className="w-5 h-5" />}
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-lg mb-0.5">{leave.category}</h4>
                        <DateDetailsModal dates={leave.dates}>
                          <button className="text-sm text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {leave.dates && leave.dates.length > 0 ? (
                              leave.dates.length === 1 ? (
                                format(new Date(leave.dates[0]), "d MMMM yyyy", { locale: id })
                              ) : (
                                `${format(new Date(leave.dates[0]), "d MMM yyyy", { locale: id })} - ${format(new Date(leave.dates[leave.dates.length - 1]), "d MMM", { locale: id })} (${leave.dates.length} days)`
                              )
                            ) : (
                              format(new Date(leave.created_at), "d MMMM yyyy", { locale: id })
                            )}
                          </button>
                        </DateDetailsModal>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {leave.status === 'pending' && (
                        <CancelLeaveButton leaveId={leave.id} />
                      )}
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider
                        ${isAcc ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                          isRejected ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                            'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'}`}>
                        {leave.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No requests yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  You haven't submitted any leave requests. Your history will appear here once you do.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/form">Submit your first request</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
