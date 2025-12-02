'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PaymentFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
        {/* Failed Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          Your payment could not be processed. Please try again or use a different payment method.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-yellow-800">
            <strong>Common reasons for payment failure:</strong>
          </p>
          <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
            <li>Insufficient funds in your e-wallet</li>
            <li>Payment timed out or was cancelled</li>
            <li>Network connection issues</li>
            <li>E-wallet account verification required</li>
          </ul>
        </div>

        <div className="space-y-3">
          {reservationId && (
            <Link href={`/checkout?retry=${reservationId}`} className="block">
              <Button className="w-full">Try Again</Button>
            </Link>
          )}
          <Link href="/bookings" className="block">
            <Button variant="outline" className="w-full">
              View My Bookings
            </Button>
          </Link>
          <Link href="/courts" className="block">
            <Button variant="outline" className="w-full">
              Browse Courts
            </Button>
          </Link>
        </div>

        {reservationId && (
          <p className="text-xs text-gray-500 mt-6">
            Reservation ID: {reservationId.slice(0, 8)}...
          </p>
        )}
      </div>
    </div>
  )
}
