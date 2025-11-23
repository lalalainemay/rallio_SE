'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { TimeSlotGrid } from './time-slot-grid'
import { getAvailableTimeSlotsAction } from '@/app/actions/reservations'
import { useCheckoutStore } from '@/stores/checkout-store'
import { format } from 'date-fns'
import type { Venue, Court } from '@rallio/shared'
import type { TimeSlot } from '@/app/actions/reservations'

interface BookingFormProps {
  venue: Venue & { courts?: Court[] }
  courts: Court[]
  selectedCourtId: string
  userId: string
}

export function BookingForm({ venue, courts, selectedCourtId, userId }: BookingFormProps) {
  const router = useRouter()
  const { setBookingData } = useCheckoutStore()

  // Form state
  const [courtId, setCourtId] = useState(selectedCourtId)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [duration, setDuration] = useState(1) // hours
  const [notes, setNotes] = useState('')

  // UI state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCourt = courts.find((c) => c.id === courtId)

  // Load time slots when date or court changes
  useEffect(() => {
    if (!selectedDate || !courtId) {
      setTimeSlots([])
      return
    }

    setIsLoadingSlots(true)
    setError(null)
    setSelectedTime(undefined)

    getAvailableTimeSlotsAction(courtId, selectedDate.toISOString())
      .then((slots) => {
        setTimeSlots(slots)
        setIsLoadingSlots(false)
      })
      .catch((err) => {
        console.error('Error loading time slots:', err)
        setError('Failed to load available time slots')
        setIsLoadingSlots(false)
      })
  }, [selectedDate, courtId])

  // Calculate total price
  const totalPrice = selectedCourt ? selectedCourt.hourlyRate * duration : 0

  // Calculate end time based on start time and duration
  const getEndTime = (startTime: string, durationHours: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHours = hours + durationHours
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Check if selected duration is available
  const isDurationAvailable = (): boolean => {
    if (!selectedTime || !timeSlots.length) return false

    const startHour = parseInt(selectedTime.split(':')[0])

    // Check if all consecutive slots are available
    for (let i = 0; i < duration; i++) {
      const hour = startHour + i
      const timeString = `${hour.toString().padStart(2, '0')}:00`
      const slot = timeSlots.find((s) => s.time === timeString)

      if (!slot || !slot.available) {
        return false
      }
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime || !selectedCourt) {
      setError('Please select a date, time, and court')
      return
    }

    if (!isDurationAvailable()) {
      setError(`The selected ${duration}-hour slot is not fully available`)
      return
    }

    const endTime = getEndTime(selectedTime, duration)

    // Save booking data to checkout store
    setBookingData({
      courtId: courtId,
      courtName: selectedCourt.name,
      venueId: venue.id,
      venueName: venue.name,
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTime,
      hourlyRate: totalPrice,
      capacity: selectedCourt.capacity,
    })

    // Navigate to checkout
    router.push('/checkout')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>

        {/* Court Selection */}
        <div className="mb-6">
          <Select
            label="Select Court"
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            required
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name} - ₱{court.hourlyRate}/hour ({court.courtType})
              </option>
            ))}
          </Select>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <Label className="block mb-2">Select Date</Label>
          <div className="border border-gray-200 rounded-lg inline-block">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                // Disable past dates
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today
              }}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="mb-6">
            <Label className="block mb-3">Select Start Time</Label>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
                <span className="ml-2 text-gray-600">Loading available times...</span>
              </div>
            ) : (
              <TimeSlotGrid
                slots={timeSlots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
              />
            )}
          </div>
        )}

        {/* Duration Selection */}
        {selectedTime && (
          <div className="mb-6">
            <Label htmlFor="duration" className="block mb-2">
              Duration (hours)
            </Label>
            <Select
              id="duration"
              value={duration.toString()}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              required
            >
              {[1, 2, 3, 4].map((hours) => (
                <option key={hours} value={hours}>
                  {hours} {hours === 1 ? 'hour' : 'hours'}
                </option>
              ))}
            </Select>
            {selectedTime && (
              <p className="text-sm text-gray-600 mt-2">
                Booking from {formatTime(selectedTime)} to {formatTime(getEndTime(selectedTime, duration))}
              </p>
            )}
            {selectedTime && !isDurationAvailable() && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ The selected {duration}-hour time slot is not fully available. Please choose a different time or duration.
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <Label htmlFor="notes" className="block mb-2">
            Notes (Optional)
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or notes for the venue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Price Summary & Submit */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-xl font-bold text-gray-900">₱{totalPrice.toFixed(2)}</span>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!selectedDate || !selectedTime || !isDurationAvailable() || isLoadingSlots}
        >
          Continue to Payment
        </Button>

        <p className="text-xs text-gray-500 text-center mt-3">
          You'll review and confirm your booking before payment
        </p>
      </div>
    </form>
  )
}

// Helper function to format time
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
