import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') redirect('/dashboard')

  // Fetch all users and their leave counts
  // For simplicity, we fetch all profiles and all approved 'Tahunan' leaves
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: allLeaves } = await supabase
    .from('cuti')
    .select('userid, dates')
    .eq('category', 'Tahunan')
    .eq('status', 'acc')

  // Calculate quota for each user
  const userStats = allEmployees.map(u => {
    const userLeaves = allLeaves?.filter(l => l.employee_id === u.id) || []
    const daysUsed = userLeaves.reduce((acc, curr) => acc + curr.dates.length, 0)
    return {
      ...u,
      daysUsed,
      remaining: 12 - daysUsed
    }
  })

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground">
            View all registered employees and their leave balances.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/employees/create">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Annual Leave Used</TableHead>
              <TableHead>Remaining Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userStats && userStats.length > 0 ? (
              userStats.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/employees/${u.id}`} className="text-primary hover:underline">
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{u.daysUsed} days</TableCell>
                  <TableCell>
                    <span className={u.remaining < 3 ? "text-red-500 font-bold" : ""}>
                      {u.remaining} days
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
