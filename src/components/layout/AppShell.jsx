import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Bell, 
  Search, 
  LayoutDashboard, 
  Inbox, 
  BookOpen, 
  CheckSquare, 
  Users, 
  Settings, 
  FileCheck2
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { getLeaveQuotaOverviewAction } from '@/app/actions/leaveActions'

export async function AppShell({ children }) {
  const supabase = await createClient()

  // 1. Fetch User and enforce Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch Employee Record
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!employee) redirect('/pending')

  // 3. User Metadata (Avatar)
  const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=6e62e5&color=fff`

  // 4. Calculate Quota for Right Sidebar using new Buckets Action
  const quotaOverview = await getLeaveQuotaOverviewAction(employee.id);
  const remainingQuota = quotaOverview?.totalRemaining || 0;
  const progressPercent = quotaOverview?.progressPercent || 0;

  // 5. Recent History for Right Sidebar
  const { data: recentLeaves } = await supabase
    .from('cuti')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="flex bg-slate-50 overflow-hidden font-sans w-full" style={{ height: "100vh" }}>
      
      {/* 1. LEFT SIDEBAR */}
      <Sidebar role={employee.role} employee={employee} avatarUrl={avatarUrl} />

      {/* CENTER CONTENT CONTAINER */}
      <div className="flex flex-col flex-1 overflow-hidden h-full rounded-none lg:rounded-l-[2rem] bg-slate-50/50">
        
        {/* MAIN CONTENT */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* CENTER CONTENT */}
          <main className="flex-1 overflow-y-auto pt-16 lg:pt-8 pb-8 pl-4 pr-4 lg:pl-8 lg:pr-8 custom-scrollbar relative">
            {children}
          </main>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </div>
  )
}
