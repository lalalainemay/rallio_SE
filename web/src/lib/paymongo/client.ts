/**
 * PayMongo API Client
 * Server-side only - uses secret key
 */

import type {
  PayMongoSource,
  PayMongoPaymentIntent,
  PayMongoPayment,
  CreateSourceParams,
  CreatePaymentIntentParams,
  CreatePaymentParams,
  PayMongoResponse,
  PayMongoError,
} from './types'

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1'
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY

if (!PAYMONGO_SECRET_KEY) {
  console.warn('⚠️  PAYMONGO_SECRET_KEY not set in environment variables')
}

/**
 * Base fetch wrapper for PayMongo API calls
 */
async function paymongoFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PayMongo secret key not configured')
  }

  const authHeader = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')

  const response = await fetch(`${PAYMONGO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authHeader}`,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    const error = data as PayMongoError
    throw new Error(
      error.errors?.[0]?.detail || 'PayMongo API error'
    )
  }

  return data as T
}

/**
 * Create a payment source (GCash, Maya, GrabPay)
 * This generates a checkout URL that the user can use to complete payment
 */
export async function createSource(
  params: CreateSourceParams
): Promise<PayMongoSource> {
  const response = await paymongoFetch<PayMongoResponse<PayMongoSource>>(
    '/sources',
    {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            amount: params.amount,
            type: params.type,
            currency: params.currency || 'PHP',
            redirect: params.redirect,
            billing: params.billing,
            metadata: params.metadata,
          },
        },
      }),
    }
  )

  return response.data
}

/**
 * Create a payment intent
 * Payment intents are used for card payments and other payment methods
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PayMongoPaymentIntent> {
  const response = await paymongoFetch<PayMongoResponse<PayMongoPaymentIntent>>(
    '/payment_intents',
    {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            amount: params.amount,
            currency: params.currency || 'PHP',
            description: params.description,
            statement_descriptor: params.statement_descriptor,
            payment_method_allowed: params.payment_method_allowed,
            metadata: params.metadata,
          },
        },
      }),
    }
  )

  return response.data
}

/**
 * Create a payment from a chargeable source
 * This is called after a source becomes chargeable (user completed payment in e-wallet)
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<PayMongoPayment> {
  const response = await paymongoFetch<PayMongoResponse<PayMongoPayment>>(
    '/payments',
    {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            amount: params.amount,
            currency: params.currency || 'PHP',
            description: params.description,
            statement_descriptor: params.statement_descriptor,
            source: params.source,
            metadata: params.metadata,
          },
        },
      }),
    }
  )

  return response.data
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PayMongoPaymentIntent> {
  const response = await paymongoFetch<PayMongoResponse<PayMongoPaymentIntent>>(
    `/payment_intents/${paymentIntentId}`
  )

  return response.data
}

/**
 * Retrieve a source by ID
 */
export async function getSource(sourceId: string): Promise<PayMongoSource> {
  const response = await paymongoFetch<PayMongoResponse<PayMongoSource>>(
    `/sources/${sourceId}`
  )

  return response.data
}

/**
 * Retrieve a payment by ID
 */
export async function getPayment(paymentId: string): Promise<PayMongoPayment> {
  const response = await paymongoFetch<PayMongoResponse<PayMongoPayment>>(
    `/payments/${paymentId}`
  )

  return response.data
}

/**
 * Helper: Convert pesos to centavos (PayMongo uses centavos)
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100)
}

/**
 * Helper: Convert centavos to pesos
 */
export function centavosToPesos(centavos: number): number {
  return centavos / 100
}

/**
 * Helper: Generate checkout URL for GCash payment
 */
export async function createGCashCheckout(params: {
  amount: number // In pesos
  description: string
  metadata?: Record<string, any>
  successUrl: string
  failedUrl: string
  billing?: {
    name?: string
    email?: string
    phone?: string
  }
}): Promise<{ checkoutUrl: string; sourceId: string }> {
  const source = await createSource({
    amount: pesosToCentavos(params.amount),
    type: 'gcash',
    redirect: {
      success: params.successUrl,
      failed: params.failedUrl,
    },
    billing: params.billing,
    metadata: {
      ...params.metadata,
      description: params.description,
    },
  })

  return {
    checkoutUrl: source.attributes.redirect.checkout_url,
    sourceId: source.id,
  }
}

/**
 * Helper: Generate checkout URL for Maya payment
 */
export async function createMayaCheckout(params: {
  amount: number // In pesos
  description: string
  metadata?: Record<string, any>
  successUrl: string
  failedUrl: string
  billing?: {
    name?: string
    email?: string
    phone?: string
  }
}): Promise<{ checkoutUrl: string; sourceId: string }> {
  const source = await createSource({
    amount: pesosToCentavos(params.amount),
    type: 'paymaya',
    redirect: {
      success: params.successUrl,
      failed: params.failedUrl,
    },
    billing: params.billing,
    metadata: {
      ...params.metadata,
      description: params.description,
    },
  })

  return {
    checkoutUrl: source.attributes.redirect.checkout_url,
    sourceId: source.id,
  }
}
