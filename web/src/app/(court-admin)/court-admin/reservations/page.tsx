import { Metadata } from 'next'
import { ReservationManagement } from '@/components/court-admin/reservation-management'

export const metadata: Metadata = {
  title: 'Reservations | Court Admin',
  description: 'Manage court reservations and bookings',
}

export default function ReservationsPage() {
  return <ReservationManagement />
}
