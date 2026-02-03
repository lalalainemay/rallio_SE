import { NextRequest, NextResponse } from 'next/server'
import { validateBookingAvailabilityAction } from '@/app/actions/reservations'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { courtId, startTimeISO, endTimeISO, recurrenceWeeks, selectedDays } = body

        const result = await validateBookingAvailabilityAction({
            courtId,
            startTimeISO,
            endTimeISO,
            recurrenceWeeks,
            selectedDays
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { available: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
