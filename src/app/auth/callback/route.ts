import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback - Code:', code ? 'present' : 'missing')
  console.log('Auth callback - Next:', next)
  console.log('Auth callback - Origin:', origin)

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Exchange code result:', {
      success: !error,
      userId: data?.user?.id,
      error: error?.message
    })

    if (!error && data.user) {
      // Use admin client to safely upsert user profile
      const adminClient = await createClient()

      // Create or update user profile in database
      const { error: upsertError } = await adminClient
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
          role: 'user', // Default role
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('Error upserting user profile:', upsertError)
      } else {
        console.log('User profile upserted successfully')
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      // Redirect to home page first to let middleware handle auth properly
      const redirectPath = '/'

      console.log('Redirecting to:', redirectPath)

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  console.log('Auth callback failed, redirecting to error page')
  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}