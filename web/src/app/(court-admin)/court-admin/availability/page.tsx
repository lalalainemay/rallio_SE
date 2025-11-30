import { Metadata } from 'next'
import { AvailabilityManagement } from '@/components/court-admin/availability-management'

export const metadata: Metadata = {
  title: 'Availability | Court Admin',
  description: 'Manage court availability and blocked dates',
}

export default function AvailabilityPage() {
  return <AvailabilityManagement />
}
