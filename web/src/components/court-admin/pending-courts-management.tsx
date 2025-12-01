'use client'

import { useState, useEffect } from 'react'
import { getPendingCourts } from '@/app/actions/court-admin-actions'
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface PendingCourt {
  id: string
  name: string
  description?: string
  court_type: string
  surface_type?: string
  capacity: number
  hourly_rate: number
  is_active: boolean
  is_verified: boolean
  created_at: string
  venue: {
    id: string
    name: string
    city?: string
    address?: string
  }
  court_amenities: Array<{
    amenity: {
      id: string
      name: string
      icon?: string
    }
  }>
}

export default function PendingCourtsManagement() {
  const [courts, setCourts] = useState<PendingCourt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingCourts()
  }, [])

  const loadPendingCourts = async () => {
    setLoading(true)
    try {
      const result = await getPendingCourts()
      if (!result.success) {
        throw new Error(result.error)
      }
      setCourts(result.courts || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load pending courts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Courts</h1>
        <p className="text-gray-600 mt-2">
          Courts awaiting admin verification
        </p>
      </div>

      {/* Alert Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Verification Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              These courts are pending verification by a global admin. Once verified, they will be visible to players and available for booking.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Courts Grid */}
      {courts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Courts Verified</h3>
          <p className="text-gray-500">
            You don't have any courts pending verification at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <div key={court.id} className="bg-white rounded-xl border border-yellow-200 p-6 hover:shadow-lg transition-shadow">
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Pending Verification
                </span>
              </div>

              {/* Court Name & Type */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{court.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <span className="capitalize">{court.court_type}</span>
                {court.surface_type && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="capitalize">{court.surface_type}</span>
                  </>
                )}
              </div>

              {/* Venue Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{court.venue.name}</div>
                    {court.venue.city && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {court.venue.city}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {court.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{court.description}</p>
              )}

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Capacity
                  </span>
                  <span className="font-medium text-gray-900">{court.capacity} players</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Hourly Rate
                  </span>
                  <span className="font-semibold text-purple-600">₱{court.hourly_rate}</span>
                </div>
              </div>

              {/* Amenities */}
              {court.court_amenities && court.court_amenities.length > 0 && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-xs text-gray-500 mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-1">
                    {court.court_amenities.map((ca) => (
                      <span
                        key={ca.amenity.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {ca.amenity.icon && <span>{ca.amenity.icon}</span>}
                        {ca.amenity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitted Date */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Submitted {new Date(court.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      {courts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">What happens next?</h3>
              <p className="text-sm text-blue-700 mt-1">
                A global admin will review your court submission and verify it. You'll be notified once your court is approved and available for bookings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
