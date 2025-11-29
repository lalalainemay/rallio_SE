import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics | Court Admin',
  description: 'View revenue analytics and insights',
}

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-500">Coming soon...</p>
      </div>
    </div>
  )
}
