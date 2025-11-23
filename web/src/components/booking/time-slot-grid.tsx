'use client'

import { cn } from '@/lib/utils'

export interface TimeSlot {
  time: string // HH:mm format
  available: boolean
  price?: number
}

interface TimeSlotGridProps {
  slots: TimeSlot[]
  selectedTime?: string
  onSelectTime: (time: string) => void
  className?: string
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelectTime,
  className,
}: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No available time slots for this date
      </div>
    )
  }

  // Count available and reserved slots for the legend
  const availableCount = slots.filter(s => s.available).length
  const reservedCount = slots.filter(s => !s.available).length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Legend */}
      {reservedCount > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-600 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
            <span>Available ({availableCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
            <span>Reserved ({reservedCount})</span>
          </div>
        </div>
      )}

      {/* Time Slot Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.time
        const isDisabled = !slot.available

        return (
          <button
            key={slot.time}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelectTime(slot.time)}
            className={cn(
              'px-4 py-3 rounded-lg border text-sm font-medium transition-all relative',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected && !isDisabled && 'bg-primary text-white border-primary shadow-md',
              !isSelected && !isDisabled && 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-gray-50 hover:shadow-sm',
              isDisabled && 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed relative',
              isDisabled && 'after:absolute after:inset-0 after:bg-gray-100/50'
            )}
            aria-label={isDisabled ? `${formatTime(slot.time)} - Reserved` : `${formatTime(slot.time)} - Available`}
            aria-disabled={isDisabled}
          >
            <div className="flex flex-col items-center gap-1 relative z-10">
              {isDisabled && (
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className={cn(
                'font-medium',
                isDisabled && 'line-through'
              )}>{formatTime(slot.time)}</span>
              {isDisabled && (
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                  Reserved
                </span>
              )}
            </div>
          </button>
        )
      })}
      </div>
    </div>
  )
}

// Helper function to format time from 24h to 12h format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
