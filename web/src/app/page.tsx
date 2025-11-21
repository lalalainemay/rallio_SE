import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Disable caching for this page to always get fresh profile data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if profile is completed - using cache: 'no-store' for fresh data
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_completed')
      .eq('id', user.id)
      .single()

    if (profile?.profile_completed) {
      redirect('/home')
    } else {
      redirect('/setup-profile')
    }
  }

  redirect('/login')
}
