import { Metadata } from 'next'
import { AnalyticsDashboard } from '@/components/court-admin/analytics-dashboard'

export const metadata: Metadata = {
  title: 'Analytics | Court Admin',
  description: 'View revenue analytics and insights',
}

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}
