'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Clock,
  BarChart3,
  PieChart,
  Download,
  Filter
} from 'lucide-react'

interface RevenueData {
  month: string
  revenue: number
  bookings: number
}

interface CourtPerformance {
  courtName: string
  bookings: number
  revenue: number
  utilization: number
}

const MOCK_REVENUE_DATA: RevenueData[] = [
  { month: 'Jan', revenue: 125000, bookings: 245 },
  { month: 'Feb', revenue: 138000, bookings: 268 },
  { month: 'Mar', revenue: 142000, bookings: 285 },
  { month: 'Apr', revenue: 155000, bookings: 302 },
  { month: 'May', revenue: 168000, bookings: 325 },
  { month: 'Jun', revenue: 172000, bookings: 338 },
]

const MOCK_COURT_PERFORMANCE: CourtPerformance[] = [
  { courtName: 'Court 1', bookings: 145, revenue: 65250, utilization: 85 },
  { courtName: 'Court 2', bookings: 138, revenue: 62100, utilization: 82 },
  { courtName: 'Court 3', bookings: 125, revenue: 52500, utilization: 78 },
  { courtName: 'Court 4', bookings: 118, revenue: 49350, utilization: 75 },
]

const PEAK_HOURS = [
  { time: '6-7 AM', bookings: 15 },
  { time: '7-8 AM', bookings: 28 },
  { time: '8-9 AM', bookings: 42 },
  { time: '9-10 AM', bookings: 35 },
  { time: '10-11 AM', bookings: 22 },
  { time: '11-12 PM', bookings: 18 },
  { time: '12-1 PM', bookings: 25 },
  { time: '1-2 PM', bookings: 30 },
  { time: '2-3 PM', bookings: 28 },
  { time: '3-4 PM', bookings: 32 },
  { time: '4-5 PM', bookings: 45 },
  { time: '5-6 PM', bookings: 68 },
  { time: '6-7 PM', bookings: 85 },
  { time: '7-8 PM', bookings: 92 },
  { time: '8-9 PM', bookings: 78 },
  { time: '9-10 PM', bookings: 45 },
]

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  const maxBookings = Math.max(...PEAK_HOURS.map(h => h.bookings))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Revenue insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </select>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₱172,000</p>
          <p className="text-xs text-gray-500 mt-1">vs last month: ₱168,000</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +8.2%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">338</p>
          <p className="text-xs text-gray-500 mt-1">vs last month: 325</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              +15.3%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Unique Customers</p>
          <p className="text-3xl font-bold text-gray-900">156</p>
          <p className="text-xs text-gray-500 mt-1">vs last month: 135</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <TrendingDown className="w-3 h-3" />
              -2.1%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg. Booking Value</p>
          <p className="text-3xl font-bold text-gray-900">₱509</p>
          <p className="text-xs text-gray-500 mt-1">vs last month: ₱520</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
            <p className="text-sm text-gray-500 mt-1">Monthly revenue over the last 6 months</p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-3">
          {MOCK_REVENUE_DATA.map((data, index) => {
            const maxRevenue = Math.max(...MOCK_REVENUE_DATA.map(d => d.revenue))
            const width = (data.revenue / maxRevenue) * 100

            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{data.month}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{data.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{data.bookings} bookings</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Court Performance */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Court Performance</h2>
              <p className="text-sm text-gray-500 mt-1">Utilization and revenue by court</p>
            </div>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {MOCK_COURT_PERFORMANCE.map((court, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{court.courtName}</h3>
                  <span className="text-sm font-semibold text-green-600">
                    ₱{court.revenue.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Bookings</span>
                    <span className="font-medium text-gray-900">{court.bookings}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Utilization</span>
                      <span className="font-medium text-gray-900">{court.utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          court.utilization >= 80
                            ? 'bg-green-500'
                            : court.utilization >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${court.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Peak Hours</h2>
              <p className="text-sm text-gray-500 mt-1">Booking distribution by hour</p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {PEAK_HOURS.map((hour, index) => {
              const width = (hour.bookings / maxBookings) * 100
              const isPeak = hour.bookings > maxBookings * 0.7

              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-16">{hour.time}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${
                          isPeak
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        {width > 15 && (
                          <span className="text-xs font-semibold text-white">
                            {hour.bookings}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {width <= 15 && (
                    <span className="text-xs font-semibold text-gray-700 w-8">
                      {hour.bookings}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Revenue Growth</h3>
              <p className="text-sm text-green-700">
                Your revenue has increased by 12.5% this month. Keep up the great work!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Peak Hours: 6-9 PM</h3>
              <p className="text-sm text-blue-700">
                Evening hours are your busiest. Consider implementing premium pricing during these times.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Customer Retention</h3>
              <p className="text-sm text-purple-700">
                65% of customers are returning players. Focus on retention strategies to boost this further.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
