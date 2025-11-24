import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileEditClient } from './profile-edit-client'

export const metadata = {
  title: 'Edit Profile | Rallio',
  description: 'Edit your profile information',
}

export const dynamic = 'force-dynamic'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get player data
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <ProfileEditClient profile={profile} player={player} />
}
