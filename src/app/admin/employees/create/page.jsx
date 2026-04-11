import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default async function CreateEmployeePage() {
  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') redirect('/dashboard')

  async function createEmployee(formData) {
    'use server'
    const name = formData.get('name')
    const email = formData.get('email')
    const role = formData.get('role')

    const supabaseServer = await createClient()

    const { error } = await supabaseServer
      .from('employees')
      .insert({ name, email, role })

    if (error) {
      console.error('Error creating employee:', error)
      // Throwing error from server action will require an error boundary or returning an error state.
      // For simplicity, we just redirect back with error in query
      // (a real app would use useActionState but this works for basic flow)
      return redirect(`/admin/employees/create?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/admin/employees')
    redirect('/admin/employees')
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Employee</h1>
          <p className="text-muted-foreground">Add a new official employee profile.</p>
        </div>
      </div>

      <Card>
        <form action={createEmployee}>
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
            <CardDescription>
              Enter the employee's official company details. They will use the email to automatically link their account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="E.g. John Doe" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input id="email" name="email" type="email" placeholder="E.g. john@company.com" required />
              <p className="text-xs text-muted-foreground">
                Must match their Google account email for auto-linking.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger id="role" name="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild variant="ghost">
              <Link href="/admin/employees">Cancel</Link>
            </Button>
            <Button type="submit">Create Employee</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
