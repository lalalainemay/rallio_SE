import { Metadata } from 'next'
import { ReviewsManagement } from '@/components/court-admin/reviews-management'

export const metadata: Metadata = {
  title: 'Reviews | Court Admin',
  description: 'Manage and respond to customer reviews',
}

export default function ReviewsPage() {
  return <ReviewsManagement />
}
