import { Metadata } from 'next'
import { PricingManagement } from '@/components/court-admin/pricing-management'

export const metadata: Metadata = {
  title: 'Pricing | Court Admin',
  description: 'Manage court pricing and rates',
}

export default function PricingPage() {
  return <PricingManagement />
}
