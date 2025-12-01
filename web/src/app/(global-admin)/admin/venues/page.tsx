'use client'

import { useState } from 'react'
import { VenueManagementGlobal } from '@/components/global-admin/venue-management-global'
import { AmenityManagement } from '@/components/global-admin/amenity-management'
import { Building2, Package } from 'lucide-react'

export default function VenuesPage() {
  const [activeTab, setActiveTab] = useState<'venues' | 'amenities'>('venues')

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('venues')}
            className={`inline-flex items-center gap-2 px-1 pb-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'venues'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Venues & Courts
          </button>
          <button
            onClick={() => setActiveTab('amenities')}
            className={`inline-flex items-center gap-2 px-1 pb-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'amenities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-5 h-5" />
            Amenities
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'venues' ? <VenueManagementGlobal /> : <AmenityManagement />}
    </div>
  )
}
