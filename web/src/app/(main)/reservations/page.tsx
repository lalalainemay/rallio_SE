import { createClient } from '@/lib/supabase/server'
import { getUserReservations } from '@/lib/api/reservations'
import { redirect } from 'next/navigation'
import { ReservationsList } from './reservations-list'

export const metadata = {
  title: 'My Reservations | Rallio',
  description: 'View and manage your court reservations',
}

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const reservations = await getUserReservations(user.id)

  const activeStatuses = ['pending_payment', 'pending', 'paid', 'confirmed']

  const stats = {
    total: reservations.length,
    upcoming: reservations.filter((r: any) => new Date(r.start_time) > new Date() && activeStatuses.includes(r.status)).length,
    completed: reservations.filter((r: any) => r.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
              <p className="text-gray-600 mt-2">Complete history of all your court bookings</p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <p className="text-xs text-primary font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReservationsList initialReservations={reservations as any} />
      </main>
    </div>
  )
}
