import { NextRequest, NextResponse } from 'next/server'
import { createReservationAction } from '@/app/actions/reservations'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            courtId,
            startTimeISO,
            endTimeISO,
            totalAmount,
            numPlayers,
            paymentType,
            paymentMethod,
            notes,
            recurrenceWeeks,
            selectedDays
        } = body

        // Call the shared server action
        const result = await createReservationAction({
            courtId,
            userId: user.id,
            startTimeISO,
            endTimeISO,
            totalAmount,         // Note: Ensure mobile passes the GRAND TOTAL as expected by the action
            numPlayers,
            paymentType,
            paymentMethod,
            notes,
            recurrenceWeeks,
            selectedDays
        })

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('API Create Reservation Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
