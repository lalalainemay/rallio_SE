import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getQueueMasterHistory } from '@/app/actions/queue-actions'
import { QueueMasterHistoryClient } from '@/components/queue-master/queue-master-history-client'

export const metadata: Metadata = {
    title: 'My History | Queue Master',
    description: 'View your past queue sessions',
}

export default async function QueueMasterHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch data
    const result = await getQueueMasterHistory()
    const history = result.success ? result.history : []

    return (
        <div className="container mx-auto py-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
                <p className="text-muted-foreground mt-2">
                    Review your past sessions and earnings.
                </p>
            </div>

            <QueueMasterHistoryClient initialHistory={history || []} />
        </div>
    )
}
