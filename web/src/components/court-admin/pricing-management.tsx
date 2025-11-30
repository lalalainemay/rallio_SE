'use client'

import { useState } from 'react'
import {
  DollarSign,
  Clock,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  Users,
  Sun,
  Moon,
  Zap
} from 'lucide-react'

interface PricingRule {
  id: string
  courtName: string
  type: 'standard' | 'peak' | 'offpeak' | 'weekend' | 'special'
  rate: number
  timeRange?: string
  days?: string
  description: string
}

interface Court {
  id: string
  name: string
  baseRate: number
  peakRate: number
  weekendRate: number
}

const MOCK_COURTS: Court[] = [
  { id: '1', name: 'Court 1', baseRate: 350, peakRate: 450, weekendRate: 400 },
  { id: '2', name: 'Court 2', baseRate: 350, peakRate: 450, weekendRate: 400 },
  { id: '3', name: 'Court 3', baseRate: 300, peakRate: 400, weekendRate: 350 },
  { id: '4', name: 'Court 4', baseRate: 300, peakRate: 400, weekendRate: 350 },
]

const MOCK_PRICING_RULES: PricingRule[] = [
  {
    id: '1',
    courtName: 'All Courts',
    type: 'peak',
    rate: 450,
    timeRange: '5:00 PM - 9:00 PM',
    days: 'Mon - Fri',
    description: 'Evening peak hours on weekdays'
  },
  {
    id: '2',
    courtName: 'All Courts',
    type: 'weekend',
    rate: 400,
    timeRange: '8:00 AM - 9:00 PM',
    days: 'Sat - Sun',
    description: 'Weekend pricing'
  },
  {
    id: '3',
    courtName: 'All Courts',
    type: 'offpeak',
    rate: 300,
    timeRange: '6:00 AM - 5:00 PM',
    days: 'Mon - Fri',
    description: 'Daytime off-peak hours'
  },
  {
    id: '4',
    courtName: 'Court 3, Court 4',
    type: 'special',
    rate: 250,
    timeRange: '6:00 AM - 12:00 PM',
    days: 'Mon - Thu',
    description: 'Morning special rate for standard courts'
  },
]

export function PricingManagement() {
  const [activeTab, setActiveTab] = useState<'courts' | 'rules'>('courts')
  const [courts, setCourts] = useState<Court[]>(MOCK_COURTS)
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(MOCK_PRICING_RULES)

  const getRuleTypeInfo = (type: string) => {
    switch (type) {
      case 'peak':
        return { icon: TrendingUp, color: 'bg-red-100 text-red-700 border-red-200', label: 'Peak Hours' }
      case 'offpeak':
        return { icon: Sun, color: 'bg-green-100 text-green-700 border-green-200', label: 'Off-Peak' }
      case 'weekend':
        return { icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Weekend' }
      case 'special':
        return { icon: Zap, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Special' }
      default:
        return { icon: DollarSign, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Standard' }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
        <p className="text-gray-600">Configure court rates and dynamic pricing rules</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Base Rate</p>
              <p className="text-xl font-bold text-gray-900">₱350</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Peak Rate</p>
              <p className="text-xl font-bold text-gray-900">₱450</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Weekend Rate</p>
              <p className="text-xl font-bold text-gray-900">₱400</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Off-Peak Rate</p>
              <p className="text-xl font-bold text-gray-900">₱300</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 mb-6 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('courts')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'courts'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Court Rates</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Pricing Rules</span>
          </div>
        </button>
      </div>

      {/* Court Rates Tab */}
      {activeTab === 'courts' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Court Pricing</h2>
              <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit className="w-4 h-4" />
                <span>Bulk Edit</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Court
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peak Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weekend
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courts.map((court) => (
                    <tr key={court.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{court.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₱{court.baseRate}/hr
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600">
                          ₱{court.peakRate}/hr
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-purple-600">
                          ₱{court.weekendRate}/hr
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Pricing Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Set competitive rates based on your location and facilities</li>
              <li>• Use peak pricing during high-demand hours (evenings, weekends)</li>
              <li>• Offer discounts during off-peak hours to maximize court utilization</li>
              <li>• Review and adjust pricing monthly based on booking patterns</li>
            </ul>
          </div>
        </div>
      )}

      {/* Pricing Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Dynamic Pricing Rules</h2>
              <p className="text-sm text-gray-500 mt-1">Automatic pricing based on time and day</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pricingRules.map((rule) => {
              const typeInfo = getRuleTypeInfo(rule.type)
              const Icon = typeInfo.icon

              return (
                <div
                  key={rule.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${typeInfo.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{typeInfo.label}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-2xl font-bold text-gray-900">₱{rule.rate}</span>
                        <span className="text-sm text-gray-500">/hour</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{rule.timeRange}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{rule.days}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{rule.courtName}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Priority Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Rule Priority</h3>
                <p className="text-sm text-yellow-700">
                  When multiple rules apply to the same time slot, the system will use the highest rate. Special rules take priority over standard pricing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
