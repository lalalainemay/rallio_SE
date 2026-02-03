import { NextRequest, NextResponse } from 'next/server'
import { cancelReservationAction } from '@/app/actions/reservations'
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
        const { reservationId } = body

        if (!reservationId) {
            return NextResponse.json({ success: false, error: 'Reservation ID is required' }, { status: 400 })
        }

        // Call the shared server action
        const result = await cancelReservationAction(reservationId)

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('API Cancel Reservation Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
