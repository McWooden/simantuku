import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = await createClient()

  // Always check if there is a session to sign out from
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  // Clear cookies and redirect to login
  const url = new URL('/login', req.url)
  return NextResponse.redirect(url, { status: 303 })
}
