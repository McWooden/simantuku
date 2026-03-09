import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RequestActions } from './RequestActions'
import { DateDetailsModal } from '@/components/ui/DateDetailsModal'

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all pending requests with user information (joining profiles)
  const { data: requests, error } = await supabase
    .from('cuti')
    .select(`
      *,
      profiles (
        username
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">
            Review and manage all employee leave submissions.
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests && requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.profiles?.username || 'Unknown Employee'}
                  </TableCell>
                  <TableCell>{request.category}</TableCell>
                  <TableCell>
                    <DateDetailsModal dates={request.dates} />
                  </TableCell>
                  <TableCell>{request.dates.length}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={request.status === 'pending' ? 'outline' : 'secondary'}
                      className={
                        request.status === 'acc' ? 'bg-green-100 text-green-700 border-green-200' : 
                        request.status === 'ditolak' ? 'bg-red-100 text-red-700 border-red-200' : 
                        ''
                      }
                    >
                      {request.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'pending' && (
                      <RequestActions requestId={request.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No leave requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
