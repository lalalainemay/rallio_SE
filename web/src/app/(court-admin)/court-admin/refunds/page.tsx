import { Metadata } from 'next'
import { RefundManagement } from '@/components/court-admin/refund-management'

export const metadata: Metadata = {
  title: 'Refunds | Court Admin',
  description: 'Manage refund requests for your venues',
}

export default function RefundsPage() {
  return <RefundManagement />
}
