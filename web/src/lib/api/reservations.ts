import { createClient } from '@/lib/supabase/server'
import { format, addHours, parseISO } from 'date-fns'

export interface TimeSlot {
  time: string
  available: boolean
  price?: number
}

export interface CreateReservationData {
  courtId: string
  userId: string
  date: Date
  startTime: string
  endTime: string
  totalAmount: number
  notes?: string
}

/**
 * Get available time slots for a specific court on a given date
 */
export async function getAvailableTimeSlots(
  courtId: string,
  date: Date
): Promise<TimeSlot[]> {
  const supabase = await createClient()

  // Get the court details to know hourly rate and venue operating hours
  const { data: court, error: courtError } = await supabase
    .from('courts')
    .select(`
      id,
      hourly_rate,
      venues (
        opening_hours
      )
    `)
    .eq('id', courtId)
    .single()

  if (courtError || !court) {
    console.error('Error fetching court:', courtError)
    return []
  }

  // Get day of week from date (0 = Sunday, 6 = Saturday)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayOfWeek = dayNames[date.getDay()]

  // Get operating hours for this day
  const venueData = Array.isArray(court.venues) ? court.venues[0] : court.venues
  const openingHours = venueData?.opening_hours as Record<string, { open: string; close: string }> | null
  const dayHours = openingHours?.[dayOfWeek]

  if (!dayHours) {
    return [] // Venue closed on this day
  }

  // Parse opening and closing times
  const [openHour] = dayHours.open.split(':').map(Number)
  const [closeHour] = dayHours.close.split(':').map(Number)

  // Generate all possible hourly slots
  const allSlots: TimeSlot[] = []
  for (let hour = openHour; hour < closeHour; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`
    allSlots.push({
      time: timeString,
      available: true,
      price: court.hourly_rate,
    })
  }

  // Get existing reservations for this court on this date
  // Query for the entire day range to catch any overlapping reservations
  const dateString = format(date, 'yyyy-MM-dd')
  const activeStatuses = ['pending_payment', 'pending', 'paid', 'confirmed']

  const { data: reservations } = await supabase
    .from('reservations')
    .select('start_time, end_time, status')
    .eq('court_id', courtId)
    // Use overlapping range query to catch any reservation that spans into this date
    .gte('end_time', `${dateString}T00:00:00`)
    .lt('start_time', `${dateString}T23:59:59`)
    .in('status', activeStatuses)

  // Mark unavailable slots based on existing reservations
  if (reservations && reservations.length > 0) {
    for (const reservation of reservations) {
      try {
        // Parse ISO timestamps to get local hours
        const startTime = new Date(reservation.start_time)
        const endTime = new Date(reservation.end_time)

        const startHour = startTime.getHours()
        const endHour = endTime.getHours()

        // If end time has minutes (e.g., 14:30), we need to block that hour too
        const endHourCeil = endTime.getMinutes() > 0 ? endHour + 1 : endHour

        // Mark all hours in this reservation as unavailable
        for (let hour = startHour; hour < endHourCeil; hour++) {
          const timeString = `${hour.toString().padStart(2, '0')}:00`
          const slot = allSlots.find((s) => s.time === timeString)
          if (slot) {
            slot.available = false
          }
        }
      } catch (error) {
        console.error('Error parsing reservation time:', error, reservation)
      }
    }
  }

  // Filter out past time slots if date is today
  const now = new Date()
  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')

  if (isToday) {
    const currentHour = now.getHours()
    return allSlots.filter((slot) => {
      const slotHour = parseInt(slot.time.split(':')[0])
      return slotHour > currentHour
    })
  }

  return allSlots
}

/**
 * Check if there's a booking conflict for the given time range
 */
export async function checkBookingConflict(
  courtId: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('court_id', courtId)
    .in('status', ['pending_payment', 'pending', 'paid', 'confirmed'])
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`)
    .limit(1)

  if (error) {
    console.error('Error checking conflict:', error)
    return true // Assume conflict if there's an error
  }

  return data && data.length > 0
}

/**
 * Create a new reservation
 */
export async function createReservation(
  data: CreateReservationData
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  const supabase = await createClient()

  // Build ISO timestamp strings
  const dateString = format(data.date, 'yyyy-MM-dd')
  const startTimeISO = `${dateString}T${data.startTime}:00`
  const endTimeISO = `${dateString}T${data.endTime}:00`

  // Check for conflicts first
  const hasConflict = await checkBookingConflict(data.courtId, startTimeISO, endTimeISO)
  if (hasConflict) {
    return {
      success: false,
      error: 'This time slot is already booked. Please choose another time.',
    }
  }

  // Create the reservation
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      court_id: data.courtId,
      user_id: data.userId,
      start_time: startTimeISO,
      end_time: endTimeISO,
      status: 'pending_payment',
      total_amount: data.totalAmount,
      amount_paid: 0,
      notes: data.notes,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating reservation:', error)
    return {
      success: false,
      error: 'Failed to create reservation. Please try again.',
    }
  }

  return {
    success: true,
    reservationId: reservation.id,
  }
}

/**
 * Get user's reservations
 */
export async function getUserReservations(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      start_time,
      end_time,
      status,
      total_amount,
      amount_paid,
      notes,
      created_at,
      courts (
        id,
        name,
        venues (
          id,
          name,
          address,
          city
        )
      )
    `)
    .eq('user_id', userId)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }

  return data
}

/**
 * Cancel a reservation
 */
export async function cancelReservation(reservationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)

  if (error) {
    console.error('Error cancelling reservation:', error)
    return { success: false, error: 'Failed to cancel reservation' }
  }

  return { success: true }
}
