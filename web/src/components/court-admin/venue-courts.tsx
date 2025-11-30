'use client'

import { useState } from 'react'
import {
  Plus,
  Edit,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface Court {
  id: string
  name: string
  surface_type?: string
  court_type?: string
  hourly_rate: number
  is_active: boolean
}

interface VenueCourtsProps {
  venueId: string
}

// Mock courts data for this venue (matches database schema)
const MOCK_COURTS: Court[] = [
  {
    id: '1',
    name: 'Court 1',
    surface_type: 'wooden',
    court_type: 'indoor',
    hourly_rate: 350,
    is_active: true
  },
  {
    id: '2',
    name: 'Court 2',
    surface_type: 'wooden',
    court_type: 'indoor',
    hourly_rate: 350,
    is_active: true
  },
  {
    id: '3',
    name: 'Court 3',
    surface_type: 'synthetic',
    court_type: 'indoor',
    hourly_rate: 300,
    is_active: true
  },
  {
    id: '4',
    name: 'Court 4',
    surface_type: 'synthetic',
    court_type: 'outdoor',
    hourly_rate: 300,
    is_active: true
  },
  {
    id: '5',
    name: 'Court 5',
    surface_type: 'wooden',
    court_type: 'indoor',
    hourly_rate: 350,
    is_active: false
  },
  {
    id: '6',
    name: 'Court 6',
    surface_type: 'wooden',
    court_type: 'outdoor',
    hourly_rate: 350,
    is_active: true
  },
]

export function VenueCourts({ venueId }: VenueCourtsProps) {
  const [courts] = useState<Court[]>(MOCK_COURTS)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Courts</h2>
          <p className="text-sm text-gray-500 mt-1">{courts.length} courts in this venue</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Court</span>
        </button>
      </div>

      {/* Courts Grid */}
      {courts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">No Courts Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add courts to this venue to start accepting reservations
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Your First Court</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div
              key={court.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{court.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{court.court_type} Court</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  court.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {court.is_active ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Surface:</span>
                  <span className="font-medium text-gray-900 capitalize">{court.surface_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Base Rate:</span>
                  <span className="font-semibold text-gray-900">₱{court.hourly_rate}/hr</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <Link
                  href={`/courts/${court.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
