import { Metadata } from 'next'
import { getPublicSettings } from '@/app/actions/global-admin-settings-actions'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Rallio',
  description: 'Privacy policy and data handling practices',
}

export default async function PrivacyPolicyPage() {
  const result = await getPublicSettings('privacy_policy')
  const content = result.success && result.data ? (result.data as any).setting_value?.content : ''
  const lastUpdated = result.success && result.data ? (result.data as any).setting_value?.last_updated : null

  // Default privacy policy content if none is set in the platform settings
  const defaultContent = `
## Introduction

Welcome to Rallio ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our badminton court finder and queue management platform.

## Information We Collect

### Personal Information
- **Account Information:** Name, email address, phone number, and profile photo when you create an account
- **Location Data:** Your location to show nearby courts and venues
- **Payment Information:** Processed securely through PayMongo; we do not store your complete payment details

### Usage Information
- Booking history and preferences
- Queue participation records
- Match history and ratings
- Device and browser information

## How We Use Your Information

We use your information to:
- Provide and maintain our services
- Process court bookings and payments
- Manage queue sessions and match assignments
- Send notifications about your bookings and queue status
- Improve our platform and user experience
- Communicate with you about updates and promotions

## Information Sharing

We may share your information with:
- **Venue Owners:** To facilitate bookings and court management
- **Queue Masters:** To manage queue sessions you participate in
- **Payment Processors:** To process your transactions securely
- **Service Providers:** Who assist in operating our platform

We do not sell your personal information to third parties.

## Data Security

We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.

## Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate data
- Delete your account and associated data
- Opt-out of marketing communications

## Contact Us

If you have questions about this Privacy Policy, please contact us at:
- Email: support@rallio.app

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
`

  const displayContent = content || defaultContent

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link 
          href="/home" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
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
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related</h3>
            <div className="flex gap-4">
              <Link 
                href="/terms" 
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
