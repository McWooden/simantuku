import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Auto-sync public profile log so Unlinked Logins works
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
          role: 'user'
        }, { onConflict: 'id' })

        // Begin Auto-Link Logic
        const { data: existingEmployee } = await supabase
          .from('employees')
          .select('id')
          .eq('auth_id', user.id)
          .single()
        
        if (!existingEmployee && user.email) {
          const { data: unlinkedEmployee } = await supabase
            .from('employees')
            .select('id')
            .eq('email', user.email)
            .is('auth_id', null)
            .single()
          
          if (unlinkedEmployee) {
            await supabase
              .from('employees')
              .update({ auth_id: user.id })
              .eq('id', unlinkedEmployee.id)
          }
        }
      }
      // End Auto-Link Logic

      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Invalid_Token`)
}
