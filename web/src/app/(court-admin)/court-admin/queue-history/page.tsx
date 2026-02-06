import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getVenueQueueHistory, getMyVenues } from '@/app/actions/court-admin-actions'
import { QueueHistoryClient } from '@/components/court-admin/queue-history-client'

export const metadata: Metadata = {
    title: 'Queue History | Court Admin',
    description: 'View past queue sessions',
}

export default async function VenueQueueHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch data
    const result = await getVenueQueueHistory()
    const sessions = result.success ? result.sessions : []
    const { venues } = await getMyVenues()

    return (
        <div className="container mx-auto py-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Queue History</h1>
                <p className="text-muted-foreground mt-2">
                    Review summary and revenue from past queue sessions.
                </p>
            </div>

            <QueueHistoryClient
                initialSessions={sessions || []}
                venues={venues || []}
            />
        </div>
    )
}
