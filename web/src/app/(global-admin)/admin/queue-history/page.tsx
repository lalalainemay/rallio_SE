import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGlobalQueueHistory } from '@/app/actions/global-admin-actions'
import { GlobalQueueHistoryClient } from '@/components/admin/queue-history-client'

export const metadata: Metadata = {
    title: 'Global Queue History | Admin',
    description: 'View all queue sessions system-wide',
}

async function getAllVenues() {
    const supabase = await createClient()
    const { data } = await supabase.from('venues').select('id, name').order('name')
    return data || []
}

export default async function GlobalQueueHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch data
    const result = await getGlobalQueueHistory({ limit: 100 })
    const sessions = result.success ? result.sessions : []
    const venues = await getAllVenues()

    return (
        <div className="container mx-auto py-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Queue History (Global)</h1>
                <p className="text-muted-foreground mt-2">
                    System-wide audit of all queue sessions.
                </p>
            </div>

            <GlobalQueueHistoryClient
                initialSessions={sessions || []}
                venues={venues || []}
            />
        </div>
    )
}
