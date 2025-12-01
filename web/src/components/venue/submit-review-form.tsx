'use client'

import { useState } from 'react'
import { Star, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { submitCourtReview } from '@/app/actions/review-actions'

interface SubmitReviewFormProps {
  courtId: string
  courtName: string
  venueName: string
  reservationId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function SubmitReviewForm({
  courtId,
  courtName,
  venueName,
  reservationId,
  onSuccess,
  onCancel,
}: SubmitReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [cleanlinessRating, setCleanlinessRating] = useState(0)
  const [facilitiesRating, setFacilitiesRating] = useState(0)
  const [valueRating, setValueRating] = useState(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (overallRating === 0) {
      setError('Please select an overall rating')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await submitCourtReview({
        courtId,
        reservationId,
        overallRating,
        qualityRating: qualityRating || undefined,
        cleanlinessRating: cleanlinessRating || undefined,
        facilitiesRating: facilitiesRating || undefined,
        valueRating: valueRating || undefined,
        review: review.trim() || undefined,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setError(result.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number
    onChange: (rating: number) => void
    label: string
  }) => {
    const [hover, setHover] = useState(0)

    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 w-28">{label}</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 ${
                  star <= (hover || value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            </button>
          ))}
          {value > 0 && (
            <span className="ml-2 text-sm font-semibold text-gray-700">{value}/5</span>
          )}
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
        <p className="text-gray-600">Thank you for your feedback.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Write a Review
        </h3>
        <p className="text-sm text-gray-600">
          {courtName} at {venueName}
        </p>
      </div>

      {/* Overall Rating (Required) */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-semibold text-gray-900">
            Overall Rating <span className="text-red-500">*</span>
          </label>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setOverallRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= overallRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            </button>
          ))}
          {overallRating > 0 && (
            <span className="ml-3 text-xl font-bold text-gray-900">{overallRating}/5</span>
          )}
        </div>
      </div>

      {/* Breakdown Ratings (Optional) */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Rate specific aspects (optional)
        </p>
        <StarRating
          value={qualityRating}
          onChange={setQualityRating}
          label="Court Quality"
        />
        <StarRating
          value={cleanlinessRating}
          onChange={setCleanlinessRating}
          label="Cleanliness"
        />
        <StarRating
          value={facilitiesRating}
          onChange={setFacilitiesRating}
          label="Facilities"
        />
        <StarRating value={valueRating} onChange={setValueRating} label="Value" />
      </div>

      {/* Written Review (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Your Review (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this court..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{review.length}/1000 characters</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || overallRating === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
