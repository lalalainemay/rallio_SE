import { Metadata } from 'next'
import { VenueDetail } from '@/components/court-admin/venue-detail'

export const metadata: Metadata = {
  title: 'Venue Details | Court Admin',
  description: 'Manage venue courts, pricing, and availability',
}

interface VenueDetailPageProps {
  params: {
    id: string
  }
}

export default function VenueDetailPage({ params }: VenueDetailPageProps) {
  return <VenueDetail venueId={params.id} />
}
