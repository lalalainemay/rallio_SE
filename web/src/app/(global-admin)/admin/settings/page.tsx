import { Metadata } from 'next'
import PlatformSettingsDashboard from '@/components/global-admin/platform-settings-dashboard'

export const metadata: Metadata = {
  title: 'Settings | Admin',
  description: 'Platform settings',
}

export default function SettingsPage() {
  return <PlatformSettingsDashboard />
}
