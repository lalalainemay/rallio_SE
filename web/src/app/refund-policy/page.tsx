import { Metadata } from 'next'
import { getPublicSettings } from '@/app/actions/global-admin-settings-actions'
import ReactMarkdown from 'react-markdown'

export const metadata: Metadata = {
  title: 'Refund Policy | Rallio',
  description: 'Platform refund and cancellation policy',
}

export default async function RefundPolicyPage() {
  const result = await getPublicSettings('refund_policy')
  const content = result.success && result.data ? (result.data as any).setting_value.content : ''
  const lastUpdated = result.success && result.data ? (result.data as any).setting_value.last_updated : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund Policy</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
          
          <div className="prose prose-gray max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
