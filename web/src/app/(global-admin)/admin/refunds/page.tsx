import { Metadata } from 'next'
import { GlobalAdminRefundManagement } from '@/components/global-admin/global-admin-refund-management'

export const metadata: Metadata = {
  title: 'Refunds | Admin Dashboard',
  description: 'Manage all refund requests across the platform',
}

export default function RefundsPage() {
  return <GlobalAdminRefundManagement />
}
