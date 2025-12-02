'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'

interface EmptyCourtsStateProps {
  venueName: string
}

export function EmptyCourtsState({ venueName }: EmptyCourtsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration */}
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Building2 className="w-12 h-12 text-gray-400" />
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courts Available Yet</h3>
      <p className="text-gray-500 max-w-md mb-6">
        {venueName} hasn't added any courts yet. Check back later or explore other venues in the area.
      </p>

      {/* Action */}
      <Link
        href="/courts"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Browse Other Venues
      </Link>
    </div>
  )
}
