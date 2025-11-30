import { Metadata } from 'next'
import { VenueList } from '@/components/court-admin/venue-list'

export const metadata: Metadata = {
  title: 'My Venues | Court Admin',
  description: 'Manage your badminton court venues',
}

export default function VenuesPage() {
  return <VenueList />
}
