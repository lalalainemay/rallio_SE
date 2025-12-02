'use client'

import { useEffect } from 'react'
import { useCheckoutStore } from '@/stores/checkout-store'
import { getPlatformFee } from '@/lib/platform-settings'

/**
 * Platform Fee Loader
 * Fetches platform fee settings and updates checkout store
 * Should be included in checkout/booking pages
 */
export function PlatformFeeLoader() {
  const { setPlatformFee } = useCheckoutStore()

  useEffect(() => {
    async function loadPlatformFee() {
      const settings = await getPlatformFee()
      setPlatformFee(settings.percentage, settings.enabled)
    }

    loadPlatformFee()
  }, [setPlatformFee])

  return null // This is a logic-only component
}
