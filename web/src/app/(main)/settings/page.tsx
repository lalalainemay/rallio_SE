import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export const metadata = {
  title: 'Settings | Rallio',
  description: 'Manage your account settings and preferences',
}

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
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

  // Get notification preferences
  const { data: notificationPrefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <SettingsClient profile={profile} player={player} notificationPrefs={notificationPrefs} />
}
