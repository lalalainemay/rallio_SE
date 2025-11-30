'use client'

import { useState } from 'react'
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Flag,
  User,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Send
} from 'lucide-react'

interface Review {
  id: string
  customerName: string
  customerAvatar?: string
  courtName: string
  rating: number
  comment: string
  date: string
  helpful: number
  response?: {
    text: string
    date: string
  }
  isReported: boolean
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    customerName: 'John Doe',
    courtName: 'Court 1',
    rating: 5,
    comment: 'Excellent court! Very well maintained and the staff was friendly. Will definitely come back again.',
    date: '2025-11-25',
    helpful: 12,
    response: {
      text: 'Thank you for your kind words! We look forward to seeing you again soon.',
      date: '2025-11-26'
    },
    isReported: false
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    courtName: 'Court 2',
    rating: 4,
    comment: 'Good facility but could use better lighting in the evening. Otherwise, great experience!',
    date: '2025-11-24',
    helpful: 8,
    isReported: false
  },
  {
    id: '3',
    customerName: 'Mike Johnson',
    courtName: 'Court 3',
    rating: 5,
    comment: 'Best badminton courts in the city! Clean, modern facilities and very affordable pricing.',
    date: '2025-11-23',
    helpful: 15,
    response: {
      text: 'We appreciate your feedback! Thank you for choosing our facility.',
      date: '2025-11-23'
    },
    isReported: false
  },
  {
    id: '4',
    customerName: 'Sarah Lee',
    courtName: 'Court 1',
    rating: 3,
    comment: 'Court was okay but booking system could be improved. Had some issues with the payment process.',
    date: '2025-11-22',
    helpful: 5,
    isReported: false
  },
  {
    id: '5',
    customerName: 'Tom Wilson',
    courtName: 'Court 4',
    rating: 2,
    comment: 'Court floor was slippery and net was damaged. Not worth the price.',
    date: '2025-11-21',
    helpful: 3,
    isReported: true
  },
  {
    id: '6',
    customerName: 'Emily Chen',
    courtName: 'Court 2',
    rating: 5,
    comment: 'Amazing venue! Staff went above and beyond to help us. Highly recommend to everyone!',
    date: '2025-11-20',
    helpful: 18,
    response: {
      text: 'Thank you so much! Our team works hard to provide the best experience.',
      date: '2025-11-20'
    },
    isReported: false
  },
]

export function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS)
  const [filterRating, setFilterRating] = useState<number | 'all'>('all')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState('')

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  const totalReviews = reviews.length
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
  }))

  const filteredReviews = filterRating === 'all'
    ? reviews
    : reviews.filter(r => r.rating === filterRating)

  const handleRespond = (review: Review) => {
    setSelectedReview(review)
    setResponseText(review.response?.text || '')
    setShowResponseModal(true)
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews Management</h1>
        <p className="text-gray-600">Monitor and respond to customer feedback</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
            </div>
          </div>
          {renderStars(Math.round(averageRating), 'md')}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900">50%</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reported</p>
              <p className="text-3xl font-bold text-gray-900">
                {reviews.filter(r => r.isReported).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white border rounded-xl p-6 ${
                  review.isReported ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {review.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.customerName}</h3>
                      <p className="text-sm text-gray-500">{review.courtName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating, 'sm')}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-gray-700 mb-4">{review.comment}</p>

                {/* Review Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                    {review.isReported && (
                      <span className="flex items-center gap-1 text-sm text-red-600">
                        <Flag className="w-4 h-4" />
                        <span>Reported</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRespond(review)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{review.response ? 'Edit Response' : 'Respond'}</span>
                  </button>
                </div>

                {/* Admin Response */}
                {review.response && (
                  <div className="mt-4 pl-6 border-l-2 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-blue-900">Your Response</p>
                      <span className="text-xs text-blue-600">
                        {new Date(review.response.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{review.response.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Respond to Review</h3>
            </div>

            <div className="p-6">
              {/* Original Review */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {selectedReview.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedReview.customerName}</p>
                    {renderStars(selectedReview.rating, 'sm')}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{selectedReview.comment}</p>
              </div>

              {/* Response Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Thank you for your feedback! We appreciate your review..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={6}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowResponseModal(false)
                      setSelectedReview(null)
                      setResponseText('')
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Response</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
