'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  DollarSign,
  Clock,
  BarChart3,
  Star,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { VenueCourts } from './venue-courts'
import { PricingManagement } from './pricing-management'
import { AvailabilityManagement } from './availability-management'
import { AnalyticsDashboard } from './analytics-dashboard'
import { ReviewsManagement } from './reviews-management'

interface VenueDetailProps {
  venueId: string
}

// Mock venue data
const MOCK_VENUE = {
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
}

export function VenueDetail({ venueId }: VenueDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'courts'

  const [venue] = useState(MOCK_VENUE)

  const tabs = [
    { id: 'courts', label: 'Courts', icon: Building2 },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ]

  const handleTabChange = (tabId: string) => {
    router.push(`/court-admin/venues/${venueId}?tab=${tabId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/court-admin/venues"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Venues</span>
      </Link>

      {/* Venue Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
              {venue.is_verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>
            {venue.description && (
              <p className="text-gray-600 mb-4">{venue.description}</p>
            )}

            {/* Venue Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4" />
            <span>Edit Venue</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{venue.stats.totalCourts}</p>
            <p className="text-sm text-gray-500 mt-1">Courts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{venue.stats.activeReservations}</p>
            <p className="text-sm text-gray-500 mt-1">Active Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">₱{(venue.stats.monthlyRevenue / 1000).toFixed(0)}k</p>
            <p className="text-sm text-gray-500 mt-1">Monthly Revenue</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <p className="text-3xl font-bold text-gray-900">{venue.stats.averageRating}</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'courts' && <VenueCourts venueId={venueId} />}
        {activeTab === 'pricing' && <PricingManagement />}
        {activeTab === 'availability' && <AvailabilityManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'reviews' && <ReviewsManagement />}
      </div>
    </div>
  )
}
