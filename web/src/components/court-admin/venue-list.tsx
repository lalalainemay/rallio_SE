'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Venue {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  is_active: boolean
  is_verified: boolean
  stats: {
    totalCourts: number
    activeReservations: number
    monthlyRevenue: number
    averageRating: number
  }
}

// Mock data matching database schema
const MOCK_VENUES: Venue[] = [
  {
    id: '1',
    name: 'Sunrise Sports Complex',
    description: 'Premium badminton facility with 6 professional courts',
    address: 'Gov. Camins Ave, Zamboanga City',
    city: 'Zamboanga City',
    phone: '+63 912 345 6789',
    email: 'info@sunrisesports.ph',
    is_active: true,
    is_verified: true,
    stats: {
      totalCourts: 6,
      activeReservations: 12,
      monthlyRevenue: 85000,
      averageRating: 4.8
    }
  },
  {
    id: '2',
    name: 'Metro Badminton Center',
    description: 'Family-friendly courts with air conditioning',
    address: 'Veterans Ave, Zamboanga City',
    city: 'Zamboanga City',
    phone: '+63 917 234 5678',
    email: 'contact@metrobadminton.ph',
    is_active: true,
    is_verified: true,
    stats: {
      totalCourts: 4,
      activeReservations: 8,
      monthlyRevenue: 62000,
      averageRating: 4.6
    }
  },
  {
    id: '3',
    name: 'Champions Court Arena',
    description: 'Tournament-grade facilities for professional players',
    address: 'Mayor Jaldon St, Zamboanga City',
    city: 'Zamboanga City',
    phone: '+63 905 678 9012',
    email: 'hello@championsarena.ph',
    is_active: true,
    is_verified: false,
    stats: {
      totalCourts: 8,
      activeReservations: 15,
      monthlyRevenue: 125000,
      averageRating: 4.9
    }
  },
]

export function VenueList() {
  const [venues] = useState<Venue[]>(MOCK_VENUES)

  const totalRevenue = venues.reduce((acc, v) => acc + v.stats.monthlyRevenue, 0)
  const totalCourts = venues.reduce((acc, v) => acc + v.stats.totalCourts, 0)
  const totalReservations = venues.reduce((acc, v) => acc + v.stats.activeReservations, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Venues</h1>
            <p className="text-gray-600">Manage your badminton court venues</p>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Venue</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Venues</p>
                <p className="text-2xl font-bold text-gray-900">{venues.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Courts</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{(totalRevenue / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalReservations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      {venues.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2 text-xl">No Venues Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first venue to start managing courts and accepting reservations.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Create First Venue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/court-admin/venues/${venue.id}`}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
            >
              {/* Venue Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {venue.name}
                    </h3>
                    {venue.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {venue.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{venue.description}</p>
                  )}
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>

              {/* Venue Info */}
              <div className="space-y-2 mb-4">
                {venue.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{venue.address}</span>
                  </div>
                )}
                {venue.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{venue.phone}</span>
                  </div>
                )}
                {venue.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{venue.email}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{venue.stats.totalCourts}</p>
                    <p className="text-xs text-gray-500 mt-1">Courts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{venue.stats.activeReservations}</p>
                    <p className="text-xs text-gray-500 mt-1">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">₱{(venue.stats.monthlyRevenue / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-gray-500 mt-1">Revenue</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <p className="text-2xl font-bold text-gray-900">{venue.stats.averageRating}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Rating</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    venue.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {venue.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                      </>
                    )}
                  </span>
                  <span className="text-sm text-blue-600 font-medium group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
