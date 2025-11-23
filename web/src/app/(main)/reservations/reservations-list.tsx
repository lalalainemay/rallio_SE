'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cancelReservationAction } from '@/app/actions/reservations'
import Link from 'next/link'

interface Reservation {
  id: string
  start_time: string
  end_time: string
  status: string
  total_amount: number
  amount_paid: number
  notes?: string
  created_at: string
  courts: {
    id: string
    name: string
    venues: {
      id: string
      name: string
      address?: string
      city: string
    }
  }
}

interface ReservationsListProps {
  initialReservations: Reservation[]
}

type FilterStatus = 'all' | 'upcoming' | 'past' | 'cancelled'

export function ReservationsList({ initialReservations }: ReservationsListProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return
    }

    setCancellingId(reservationId)
    const result = await cancelReservationAction(reservationId)

    if (result.success) {
      // Update the reservation status in the list
      setReservations((prev) =>
        prev.map((res) =>
          res.id === reservationId ? { ...res, status: 'cancelled' } : res
        )
      )
    } else {
      alert(result.error || 'Failed to cancel reservation')
    }

    setCancellingId(null)
  }

  // Filter reservations
  const filteredReservations = reservations.filter((res) => {
    const now = new Date()
    const startTime = new Date(res.start_time)

    switch (filter) {
      case 'upcoming':
        return startTime > now && res.status !== 'cancelled'
      case 'past':
        return startTime <= now || res.status === 'completed'
      case 'cancelled':
        return res.status === 'cancelled'
      default:
        return true
    }
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-teal-100 text-teal-800 border-teal-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    const readable = status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
        styles[status as keyof typeof styles] || styles.pending_payment
      }`}>
        {readable}
      </span>
    )
  }

  const canCancelReservation = (reservation: Reservation): boolean => {
    const startTime = new Date(reservation.start_time)
    const now = new Date()
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Can cancel if:
    // 1. Status is pending or confirmed
    // 2. Start time is more than 24 hours away
    return (
      ['pending_payment', 'pending', 'paid', 'confirmed'].includes(reservation.status) &&
      hoursUntilStart > 24
    )
  }

  const activeStatuses = ['pending_payment', 'pending', 'paid', 'confirmed']

  const stats = {
    total: reservations.length,
    upcoming: reservations.filter(r => new Date(r.start_time) > new Date() && activeStatuses.includes(r.status)).length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-700 font-medium">Total</p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.upcoming}</p>
            <p className="text-xs text-green-700 font-medium">Upcoming</p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
            <p className="text-xs text-purple-700 font-medium">Completed</p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            <p className="text-xs text-gray-700 font-medium">Cancelled</p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {[
          { value: 'all', label: 'All' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
          { value: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as FilterStatus)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              filter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any reservations yet."
                : `No ${filter} reservations to display.`}
            </p>
            <Link href="/courts">
              <Button>Find Courts to Book</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const startDate = new Date(reservation.start_time)
            const endDate = new Date(reservation.end_time)
            const isPast = startDate < new Date()

            return (
              <Card key={reservation.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Reservation Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reservation.courts.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {reservation.courts.venues.name}
                        </p>
                        {reservation.courts.venues.address && (
                          <p className="text-xs text-gray-500 mt-1">
                            {reservation.courts.venues.address}, {reservation.courts.venues.city}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(startDate, 'EEEE, MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment</p>
                        <p className="text-sm font-medium text-gray-900">
                          ₱{reservation.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {reservation.amount_paid >= reservation.total_amount
                            ? 'Fully Paid'
                            : `Paid: ₱${reservation.amount_paid.toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {reservation.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{reservation.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    {canCancelReservation(reservation) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id)}
                        disabled={cancellingId === reservation.id}
                      >
                        {cancellingId === reservation.id ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Booking'
                        )}
                      </Button>
                    )}

                    {!isPast && reservation.status === 'confirmed' && (
                      <Link href={`/courts/${reservation.courts.venues.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Venue
                        </Button>
                      </Link>
                    )}

                    {isPast && reservation.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        Rate Court
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
