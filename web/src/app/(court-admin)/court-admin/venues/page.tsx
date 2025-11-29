import { Metadata } from 'next'
import { VenueManagement } from '@/components/court-admin/venue-management'

export const metadata: Metadata = {
  title: 'Venues & Courts | Court Admin',
  description: 'Manage your venues and courts',
}

export default function VenuesPage() {
  return <VenueManagement />
}
