'use client'

import { useState } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'

interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface BlockedDate {
  id: string
  courtName: string
  date: string
  reason: string
  type: 'maintenance' | 'event' | 'holiday' | 'other'
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const MOCK_TIME_SLOTS: TimeSlot[] = [
  { id: '1', day: 'Monday', startTime: '06:00', endTime: '22:00', isAvailable: true },
  { id: '2', day: 'Tuesday', startTime: '06:00', endTime: '22:00', isAvailable: true },
  { id: '3', day: 'Wednesday', startTime: '06:00', endTime: '22:00', isAvailable: true },
  { id: '4', day: 'Thursday', startTime: '06:00', endTime: '22:00', isAvailable: true },
  { id: '5', day: 'Friday', startTime: '06:00', endTime: '23:00', isAvailable: true },
  { id: '6', day: 'Saturday', startTime: '07:00', endTime: '23:00', isAvailable: true },
  { id: '7', day: 'Sunday', startTime: '07:00', endTime: '21:00', isAvailable: true },
]

const MOCK_BLOCKED_DATES: BlockedDate[] = [
  {
    id: '1',
    courtName: 'Court 1',
    date: '2025-12-25',
    reason: 'Christmas Day',
    type: 'holiday'
  },
  {
    id: '2',
    courtName: 'Court 2',
    date: '2025-12-15',
    reason: 'Floor resurfacing',
    type: 'maintenance'
  },
  {
    id: '3',
    courtName: 'All Courts',
    date: '2025-12-31',
    reason: 'New Year\'s Eve Event',
    type: 'event'
  },
]

export function AvailabilityManagement() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'blocked'>('schedule')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(MOCK_TIME_SLOTS)
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(MOCK_BLOCKED_DATES)
  const [showAddModal, setShowAddModal] = useState(false)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'event': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'holiday': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Availability Management</h1>
        <p className="text-gray-600">Manage court schedules and blocked dates</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 mb-6 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Operating Hours</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'blocked'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Blocked Dates</span>
          </div>
        </button>
      </div>

      {/* Operating Hours Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Operating Hours</h3>
                <p className="text-sm text-blue-700">
                  Set your default operating hours for each day of the week. These will apply to all courts unless specified otherwise.
                </p>
              </div>
            </div>
          </div>

          {/* Time Slots Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Custom Hours</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opening Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Closing Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{slot.day}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{slot.startTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{slot.endTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {slot.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            <span>Open</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-red-100 text-red-700 border-red-200 text-xs font-medium">
                            <X className="w-3 h-3" />
                            <span>Closed</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Dates Tab */}
      {activeTab === 'blocked' && (
        <div className="space-y-6">
          {/* Add Blocked Date Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Blocked Dates</h2>
              <p className="text-sm text-gray-500 mt-1">Manage dates when courts are unavailable</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Blocked Date</span>
            </button>
          </div>

          {/* Blocked Dates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium capitalize ${getTypeColor(blocked.type)}`}>
                    {blocked.type}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{blocked.courtName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {new Date(blocked.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{blocked.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {blockedDates.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Blocked Dates</h3>
              <p className="text-sm text-gray-500 mb-4">
                All courts are currently available for booking
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Blocked Date</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Blocked Date Modal (Simple placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Blocked Date</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-center py-8">
              Form UI coming soon...
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
