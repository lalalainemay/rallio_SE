import { Suspense } from 'react'
import { QueueDashboardClient } from './queue-dashboard-client'

export const metadata = {
  title: 'Queue Dashboard | Rallio',
  description: 'Manage your active queues and join new ones',
}

export default function QueueDashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Queue Dashboard</h1>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <QueueDashboardClient />
        </Suspense>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-40" />
        ))}
      </div>
    </div>
  )
}
