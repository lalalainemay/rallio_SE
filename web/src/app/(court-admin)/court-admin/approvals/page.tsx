import { Metadata } from 'next'
import { QueueApprovalsManagement } from '@/components/court-admin/queue-approvals-management'

export const metadata: Metadata = {
  title: 'Queue Session Approvals | Court Admin',
  description: 'Review and approve queue session requests',
}

export default function ApprovalsPage() {
  return <QueueApprovalsManagement />
}
