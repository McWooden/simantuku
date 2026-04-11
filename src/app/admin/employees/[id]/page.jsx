import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Calendar, FileText } from 'lucide-react'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'

export default async function UserProfilePage({ params }) {
  const { id } = await params
  
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (adminEmployee?.role !== 'admin') redirect('/dashboard')

  // Fetch the target employee's profile
  const { data: targetEmployee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (!targetEmployee) redirect('/admin/employees')

  // Fetch target employee's leave requests
  const { data: leaves } = await supabase
    .from('cuti')
    .select('*')
    .eq('employee_id', id)
    .order('created_at', { ascending: false })

  // Calculate annual leave taken this year
  const currentYear = new Date().getFullYear()
  const annualLeavesThisYear = leaves?.filter(
    l => l.category === 'Tahunan' && l.status === 'acc'
  ) || []
  
  const daysUsed = annualLeavesThisYear.reduce((acc, curr) => acc + (curr.dates?.length || 0), 0)
  const remaining = 12 - daysUsed

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/admin/employees">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Link>
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
        <p className="text-muted-foreground">View details and leave history for {targetEmployee.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Details</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetEmployee.name}</div>
            <p className="text-xs text-muted-foreground flex items-center justify-between mt-1">
              Role: <Badge variant={targetEmployee.role === 'admin' ? 'default' : 'secondary'}>{targetEmployee.role.toUpperCase()}</Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Email: {targetEmployee.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Leave Balances</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className={`text-2xl font-bold ${remaining < 3 ? 'text-red-500' : ''}`}>
                  {remaining} <span className="text-sm font-normal text-muted-foreground">days remaining</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {daysUsed} / 12 days used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaves?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time applications
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested On</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves && leaves.length > 0 ? (
                leaves.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {new Date(l.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{l.category}</TableCell>
                    <TableCell>
                      <DateDetailsModal dates={l.dates} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        l.status === 'acc' ? 'default' :
                        l.status === 'ditolak' ? 'destructive' :
                        'secondary'
                      }>
                        {l.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No leave requests found for this user.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
