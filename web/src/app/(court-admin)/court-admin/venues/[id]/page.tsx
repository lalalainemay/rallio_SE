import { Metadata } from 'next'
import { VenueDetail } from '@/components/court-admin/venue-detail'

export const metadata: Metadata = {
  title: 'Venue Details | Court Admin',
  description: 'Manage venue courts, pricing, and availability',
}

interface VenueDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { id } = await params
  return <VenueDetail venueId={id} />
}
