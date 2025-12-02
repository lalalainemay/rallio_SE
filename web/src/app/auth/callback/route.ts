import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Role priority order (highest first)
const ROLE_PRIORITY = ['global_admin', 'court_admin', 'queue_master', 'player'] as const

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    // Use service client to bypass RLS for role lookup
    const supabase = createServiceClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // If a specific redirect was requested, use that
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise, redirect based on user role (using service client to bypass RLS)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', data.user.id)

      console.log('🔍 [Auth Callback] User ID:', data.user.id)
      console.log('🔍 [Auth Callback] User roles query result:', userRoles)
      console.log('🔍 [Auth Callback] User roles query error:', rolesError)

      const roles = userRoles?.map((r: any) => r.role?.name).filter(Boolean) || []
      console.log('🔍 [Auth Callback] Extracted roles:', roles)

      // Find the highest priority role the user has
      const highestPriorityRole = ROLE_PRIORITY.find(role => roles.includes(role))
      console.log('🔍 [Auth Callback] Highest priority role:', highestPriorityRole)

      // Redirect based on highest priority role
      switch (highestPriorityRole) {
        case 'global_admin':
          return NextResponse.redirect(`${origin}/admin`)
        case 'court_admin':
          return NextResponse.redirect(`${origin}/court-admin`)
        case 'queue_master':
          return NextResponse.redirect(`${origin}/queue-master`)
        default:
          // Player or no role - go to home
          return NextResponse.redirect(`${origin}/home`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
