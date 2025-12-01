import { Metadata } from 'next'
import AnalyticsDashboard from '@/components/global-admin/analytics-dashboard'

export const metadata: Metadata = {
  title: 'Analytics | Admin',
  description: 'Platform analytics and insights',
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}
