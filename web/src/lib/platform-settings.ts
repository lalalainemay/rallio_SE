/**
 * Platform Settings Helper
 * Centralized functions for fetching and calculating platform fees
 */

import { createClient } from '@/lib/supabase/client'

export interface PlatformFeeSettings {
  percentage: number
  enabled: boolean
  description: string
}

/**
 * Get platform fee settings
 * @returns Platform fee settings or default 5%
 */
export async function getPlatformFee(): Promise<PlatformFeeSettings> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'platform_fee')
      .single()

    if (error || !data) {
      console.warn('[getPlatformFee] Failed to fetch platform fee, using default 5%', error)
      return {
        percentage: 5,
        enabled: true,
        description: 'Platform service fee',
      }
    }

    return data.setting_value as PlatformFeeSettings
  } catch (error) {
    console.error('[getPlatformFee] Error:', error)
    return {
      percentage: 5,
      enabled: true,
      description: 'Platform service fee',
    }
  }
}

/**
 * Calculate platform fee amount
 * @param subtotal - The booking subtotal before fees
 * @returns Platform fee amount
 */
export function calculatePlatformFeeAmount(subtotal: number, feePercentage: number): number {
  return Math.round((subtotal * (feePercentage / 100)) * 100) / 100
}

/**
 * Calculate total with platform fee
 * @param subtotal - The booking subtotal before fees
 * @param feePercentage - Platform fee percentage
 * @returns Total amount including platform fee
 */
export function calculateTotalWithPlatformFee(subtotal: number, feePercentage: number): number {
  const fee = calculatePlatformFeeAmount(subtotal, feePercentage)
  return Math.round((subtotal + fee) * 100) / 100
}
