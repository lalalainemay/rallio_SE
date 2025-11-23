import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

/**
 * PayMongo Webhook Handler
 * Handles payment status updates from PayMongo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('paymongo-signature')

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const eventType = event.data?.attributes?.type
    const eventId = event.data?.id || event.id
    const eventData = event.data?.attributes?.data

    console.log('PayMongo webhook event:', {
      eventType,
      eventId,
    })

    // Handle different event types
    switch (eventType) {
      case 'source.chargeable':
        await handleSourceChargeable(eventData, eventId)
        break

      case 'payment.paid':
        await handlePaymentPaid(eventData, eventId)
        break

      case 'payment.failed':
        await handlePaymentFailed(eventData, eventId)
        break

      default:
        console.log('Unhandled webhook event type:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Verify PayMongo webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false

  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('PAYMONGO_WEBHOOK_SECRET required in production')
      throw new Error('PAYMONGO_WEBHOOK_SECRET is required in production environment')
    }
    console.warn('⚠️ PAYMONGO_WEBHOOK_SECRET not set - DEVELOPMENT ONLY')
    return true
  }

  // Extract timestamp and signature from header
  // Format: t=timestamp,s=signature
  const parts = signature.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
  const sig = parts.find(p => p.startsWith('s='))?.split('=')[1]

  if (!timestamp || !sig) return false

  // Construct signed payload
  const signedPayload = `${timestamp}.${payload}`

  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex')

  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(expectedSignature)
  )
}

function normalizeReservation(relationship: any) {
  if (!relationship) return null
  if (Array.isArray(relationship)) {
    return relationship[0] || null
  }
  return relationship
}

function buildStatusHistory(metadata: any, nextStatus: string) {
  const existing = Array.isArray(metadata?.payment_status_history)
    ? metadata.payment_status_history.filter((entry: unknown) => typeof entry === 'string')
    : []

  if (existing.includes(nextStatus)) {
    return existing
  }

  return [...existing, nextStatus]
}

async function markReservationPaidAndConfirmed({
  supabase,
  payment,
  eventId,
  eventType,
}: {
  supabase: ReturnType<typeof createServiceClient>
  payment: any
  eventId?: string | null
  eventType: string
}) {
  if (!payment?.reservation_id) {
    console.warn('Webhook: Payment missing reservation_id, skipping reservation update', payment?.id)
    return
  }

  const reservationId = payment.reservation_id
  const nowISO = new Date().toISOString()

  // Fetch current reservation state
  let reservationRecord = normalizeReservation(payment.reservations)

  if (!reservationRecord) {
    const { data, error } = await supabase
      .from('reservations')
      .select('id, status, amount_paid, metadata')
      .eq('id', reservationId)
      .single()

    if (error || !data) {
      console.error('Webhook: Failed to fetch reservation for payment completion', {
        reservationId,
        error,
      })
      throw error || new Error('Reservation not found for payment completion')
    }

    reservationRecord = data
  }

  // PAYMENT CONFIRMATION FLOW (requires migration 006 applied):
  // pending_payment → paid → confirmed
  // If migration 006 NOT applied: pending → confirmed directly

  // Check if already in final state
  if (reservationRecord.status === 'confirmed') {
    // Already confirmed - just ensure amount_paid is synced
    if ((reservationRecord.amount_paid ?? 0) < payment.amount) {
      console.log('Reservation already confirmed, updating amount_paid:', reservationId)
      const { error: amountError } = await supabase
        .from('reservations')
        .update({
          amount_paid: payment.amount,
          updated_at: nowISO,
        })
        .eq('id', reservationId)

      if (amountError) {
        console.error('Webhook: Failed to sync reservation amount_paid', {
          reservationId,
          error: amountError,
        })
      }
    }
    console.log('✅ Reservation already confirmed:', reservationId)
    return
  }

  // First, mark as 'paid' to indicate payment successful
  if (reservationRecord.status !== 'paid') {
    const paidMetadata = {
      ...(reservationRecord.metadata || {}),
      payment_paid_event: {
        eventId,
        eventType,
        paidAt: nowISO,
        payment_id: payment.id,
      },
      payment_status_history: buildStatusHistory(reservationRecord.metadata, 'paid'),
    }

    console.log('Marking reservation as paid:', {
      reservationId,
      currentStatus: reservationRecord.status,
      amount: payment.amount,
    })

    const { data: paidReservation, error: paidError } = await supabase
      .from('reservations')
      .update({
        status: 'paid',
        amount_paid: payment.amount,
        updated_at: nowISO,
        metadata: paidMetadata,
      })
      .eq('id', reservationId)
      .select('id, status, amount_paid, metadata')
      .single()

    if (paidError) {
      console.error('Failed to mark reservation as paid:', {
        reservationId,
        error: paidError,
        errorCode: paidError.code,
        errorDetails: JSON.stringify(paidError, null, 2),
      })

      // If 'paid' status is not valid (migration 006 not applied), go directly to 'confirmed'
      if (paidError.code === '23514') { // CHECK constraint violation
        console.warn('⚠️ Migration 006 not applied - going directly to confirmed status')
        // Fall through to confirm step below
      } else {
        throw paidError
      }
    } else {
      reservationRecord = paidReservation
    }
  }

  // Then, mark as 'confirmed' to finalize the booking
  const confirmMetadata = {
    ...(reservationRecord.metadata || {}),
    payment_confirmed_event: {
      eventId,
      eventType,
      confirmedAt: nowISO,
      payment_id: payment.id,
    },
    payment_status_history: buildStatusHistory(reservationRecord.metadata, 'confirmed'),
  }

  console.log('Confirming reservation:', {
    reservationId,
    currentStatus: reservationRecord.status,
    amount: payment.amount,
  })

  const { data: confirmedReservation, error: confirmError } = await supabase
    .from('reservations')
    .update({
      status: 'confirmed',
      amount_paid: payment.amount,
      updated_at: nowISO,
      metadata: confirmMetadata,
    })
    .eq('id', reservationId)
    .select('id, status, amount_paid')
    .single()

  if (confirmError) {
    console.error('CRITICAL: Failed to confirm reservation after payment', {
      reservationId,
      error: confirmError,
      errorDetails: JSON.stringify(confirmError, null, 2),
    })
    throw confirmError
  }

  if (!confirmedReservation) {
    console.error('CRITICAL: Reservation update returned no data')
    throw new Error('Reservation update failed - no data returned')
  }

  console.log('✅ Reservation confirmed successfully:', {
    reservationId: confirmedReservation.id,
    status: confirmedReservation.status,
    amountPaid: confirmedReservation.amount_paid,
  })
}

/**
 * Handle source.chargeable event
 * This fires when a payment source (GCash/Maya) becomes ready to charge
 */
async function handleSourceChargeable(data: any, eventId?: string) {
  const sourceId = data.id
  console.log('Source chargeable:', sourceId)

  const supabase = createServiceClient()

  // Find the payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*, reservations(*)')
    .eq('external_id', sourceId)
    .single()

  if (paymentError || !payment) {
    console.error('Payment not found for source:', sourceId)
    return
  }

  const baseMetadata = payment.metadata || {}
  const processedEvents: string[] = Array.isArray(baseMetadata.processed_events)
    ? baseMetadata.processed_events.filter((entry: unknown) => typeof entry === 'string')
    : []

  if (eventId && processedEvents.includes(eventId)) {
    console.log('source.chargeable webhook already processed for event:', eventId)
    return
  }

  // IDEMPOTENCY CHECK: ensure reservation is confirmed even if payment already completed
  if (payment.status === 'completed') {
    console.log('Payment already completed, verifying reservation status for source:', sourceId)

    const completedAt = new Date().toISOString()
    const finalProcessedEvents = eventId
      ? Array.from(new Set([...processedEvents, eventId]))
      : processedEvents

    if (finalProcessedEvents.length !== processedEvents.length) {
      const { error: metadataError } = await supabase
        .from('payments')
        .update({
          metadata: {
            ...baseMetadata,
            processed_events: finalProcessedEvents,
            last_success_event: {
              id: eventId,
              type: 'source.chargeable',
              processedAt: completedAt,
            },
          },
        })
        .eq('id', payment.id)

      if (metadataError) {
        console.warn('source.chargeable webhook: Failed to append processed event metadata:', metadataError)
      }
    }

    try {
      await markReservationPaidAndConfirmed({
        supabase,
        payment,
        eventId,
        eventType: 'source.chargeable:duplicate',
      })
    } catch (verifyError) {
      console.error('Failed to verify reservation for already completed payment:', verifyError)
    }
    return
  }

  // Check if currently being processed
  if (baseMetadata.processing) {
    const processingStartedAt = baseMetadata.processing_started_at
    const processingDuration = processingStartedAt
      ? Date.now() - new Date(processingStartedAt).getTime()
      : 0

    // If processing for more than 5 minutes, allow retry
    if (processingDuration < 5 * 60 * 1000) {
      console.warn('Payment already being processed, skipping:', sourceId)
      return
    }
  }

  // Mark as processing to prevent concurrent handling
  await supabase
    .from('payments')
    .update({
      metadata: {
        ...baseMetadata,
        processed_events: processedEvents,
        processing: true,
        processing_started_at: new Date().toISOString(),
        last_processing_event: eventId,
      }
    })
    .eq('id', payment.id)

  // Import the charge processing function
  const { createPayment } = await import('@/lib/paymongo/client')

  try {
    // Create the actual payment/charge
    const paymentResult = await createPayment({
      amount: Math.round(payment.amount * 100), // Convert to centavos
      description: payment.metadata?.description || 'Court reservation',
      source: {
        id: sourceId,
        type: payment.payment_method as 'gcash' | 'paymaya',
      },
      metadata: {
        payment_id: payment.id,
        reservation_id: payment.reservation_id,
      },
    })

    const completedAt = new Date().toISOString()
    const finalProcessedEvents = eventId
      ? Array.from(new Set([...processedEvents, eventId]))
      : processedEvents

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        paid_at: completedAt,
        external_id: paymentResult.id, // Update with payment ID
        metadata: {
          ...baseMetadata,
          processed_events: finalProcessedEvents,
          paymongo_payment: paymentResult,
          processing: false,
          processing_completed_at: completedAt,
          last_success_event: {
            id: eventId,
            type: 'source.chargeable',
            processedAt: completedAt,
          },
        },
      })
      .eq('id', payment.id)

    await markReservationPaidAndConfirmed({
      supabase,
      payment,
      eventId,
      eventType: 'source.chargeable',
    })

    console.log('✅ Webhook: Payment completed and reservation confirmed:', payment.reservation_id)

    try {
      revalidatePath('/reservations')
      revalidatePath('/bookings')
    } catch (revalidateError) {
      console.warn('RevalidatePath failed in source.chargeable webhook:', revalidateError)
    }

    // TODO: Send confirmation email
  } catch (error) {
    console.error('Error processing chargeable source:', error)

    const failureAt = new Date().toISOString()

    // Update payment status to failed
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        metadata: {
          ...baseMetadata,
          error: error instanceof Error ? error.message : 'Unknown error',
          failed_at: failureAt,
          processing: false,
          last_failure_event: {
            id: eventId,
            type: 'source.chargeable',
            processedAt: failureAt,
          },
        }
      })
      .eq('id', payment.id)

    // NEW: Cancel the reservation to free up the time slot
    if (payment.reservation_id) {
      await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Payment processing failed',
          metadata: {
            ...payment.reservations?.metadata,
            cancelled_by_system: true,
            payment_error: error instanceof Error ? error.message : 'Payment failed'
          }
        })
        .eq('id', payment.reservation_id)

      console.log('Reservation cancelled due to payment failure:', payment.reservation_id)
    }
  }
}

/**
 * Handle payment.paid event
 * This fires when a payment is successfully completed
 */
async function handlePaymentPaid(data: any, eventId?: string) {
  const paymentId = data.id
  console.log('Payment paid:', paymentId)

  const supabase = createServiceClient()

  // Attempt to find the payment record by several possible identifiers
  // 1) external_id (the payment id)
  // 2) the source id (some webhooks reference the source)
  // 3) a payment_reference stored in metadata
  const sourceId = data.attributes?.source?.id || data.attributes?.source_id
  const paymentReference = data.attributes?.metadata?.payment_reference || data.attributes?.metadata?.payment_id
  const reservationIdFromPayload = data.attributes?.metadata?.reservation_id

  const findPaymentByColumn = async (column: string, value?: string | null) => {
    if (!value) return null
    const { data: results, error } = await supabase
      .from('payments')
      .select('*, reservations(*)')
      .eq(column, value)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !results || results.length === 0) {
      return null
    }

    return results[0]
  }

  const findPaymentByMetadataReference = async (value?: string | null) => {
    if (!value) return null
    const { data: results, error } = await supabase
      .from('payments')
      .select('*, reservations(*)')
      .contains('metadata', { payment_reference: value })
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !results || results.length === 0) {
      return null
    }

    return results[0]
  }

  let payment: any = null

  payment = await findPaymentByColumn('external_id', paymentId)
  if (!payment) payment = await findPaymentByColumn('external_id', sourceId)
  if (!payment) payment = await findPaymentByColumn('reference', paymentReference)
  if (!payment) payment = await findPaymentByMetadataReference(paymentReference)
  if (!payment) payment = await findPaymentByColumn('reservation_id', reservationIdFromPayload)

  if (!payment) {
    console.error('Payment not found:', paymentId)
    return
  }

  const baseMetadata = payment.metadata || {}
  const processedEvents: string[] = Array.isArray(baseMetadata.processed_events)
    ? baseMetadata.processed_events.filter((entry: unknown) => typeof entry === 'string')
    : []

  if (eventId && processedEvents.includes(eventId)) {
    console.log('payment.paid webhook already processed for event:', eventId)
    try {
      await markReservationPaidAndConfirmed({
        supabase,
        payment,
        eventId,
        eventType: 'payment.paid:duplicate',
      })
    } catch (verifyError) {
      console.error('Failed to verify reservation on duplicate payment.paid event:', verifyError)
    }
    return
  }

  const completedAt = new Date().toISOString()
  const finalProcessedEvents = eventId
    ? Array.from(new Set([...processedEvents, eventId]))
    : processedEvents

  if (payment.status !== 'completed') {
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        paid_at: completedAt,
        metadata: {
          ...baseMetadata,
          processed_events: finalProcessedEvents,
          last_success_event: {
            id: eventId,
            type: 'payment.paid',
            processedAt: completedAt,
          },
          paymongo_payment: {
            ...(baseMetadata.paymongo_payment || {}),
            last_webhook_event: {
              id: eventId,
              type: 'payment.paid',
              receivedAt: completedAt,
            },
          },
        },
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('payment.paid webhook: Failed to update payment record:', updateError)
    }
  } else if (finalProcessedEvents.length !== processedEvents.length) {
    const { error: metadataError } = await supabase
      .from('payments')
      .update({
        metadata: {
          ...baseMetadata,
          processed_events: finalProcessedEvents,
          last_success_event: {
            id: eventId,
            type: 'payment.paid',
            processedAt: completedAt,
          },
        },
      })
      .eq('id', payment.id)

    if (metadataError) {
      console.warn('payment.paid webhook: Failed to append processed event metadata:', metadataError)
    }
  }

  await markReservationPaidAndConfirmed({
    supabase,
    payment,
    eventId,
    eventType: 'payment.paid',
  })

  console.log('✅ payment.paid webhook: Reservation confirmed:', payment.reservation_id)

  try {
    revalidatePath('/reservations')
    revalidatePath('/bookings')
  } catch (e) {
    console.warn('RevalidatePath failed in webhook:', e)
  }
}

/**
 * Handle payment.failed event
 * This fires when a payment fails
 */
async function handlePaymentFailed(data: any, eventId?: string) {
  const paymentId = data.id
  const failureCode = data.attributes?.failure_code
  const failureMessage = data.attributes?.failure_message

  console.log('Payment failed:', paymentId, failureCode, failureMessage)

  const supabase = createServiceClient()

  // Flexible lookup (payment id, source id, payment_reference in metadata)
  const sourceId = data.attributes?.source?.id || data.attributes?.source_id
  const paymentReference = data.attributes?.metadata?.payment_reference || data.attributes?.metadata?.payment_id
  const reservationIdFromPayload = data.attributes?.metadata?.reservation_id

  let payment: any = null

  const findPaymentByColumn = async (column: string, value?: string | null) => {
    if (!value) return null
    const { data: results, error } = await supabase
      .from('payments')
      .select('*, reservations(*)')
      .eq(column, value)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !results || results.length === 0) {
      return null
    }

    return results[0]
  }

  const findPaymentByMetadataReference = async (value?: string | null) => {
    if (!value) return null
    const { data: results, error } = await supabase
      .from('payments')
      .select('*, reservations(*)')
      .contains('metadata', { payment_reference: value })
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !results || results.length === 0) {
      return null
    }

    return results[0]
  }

  payment = await findPaymentByColumn('external_id', paymentId)
  if (!payment) payment = await findPaymentByColumn('external_id', sourceId)
  if (!payment) payment = await findPaymentByColumn('reference', paymentReference)
  if (!payment) payment = await findPaymentByMetadataReference(paymentReference)
  if (!payment) payment = await findPaymentByColumn('reservation_id', reservationIdFromPayload)

  if (!payment) {
    console.error('Payment not found:', paymentId)
    return
  }

  const baseMetadata = payment.metadata || {}
  const processedEvents: string[] = Array.isArray(baseMetadata.processed_events)
    ? baseMetadata.processed_events.filter((entry: unknown) => typeof entry === 'string')
    : []

  if (eventId && processedEvents.includes(eventId)) {
    console.log('payment.failed webhook already processed for event:', eventId)
    return
  }

  const failureAt = new Date().toISOString()
  const finalProcessedEvents = eventId
    ? Array.from(new Set([...processedEvents, eventId]))
    : processedEvents

  await supabase
    .from('payments')
    .update({
      status: 'failed',
      metadata: {
        ...baseMetadata,
        failure_code: failureCode,
        failure_message: failureMessage,
        processed_events: finalProcessedEvents,
        last_failure_event: {
          id: eventId,
          type: 'payment.failed',
          processedAt: failureAt,
        },
      },
    })
    .eq('id', payment.id)

  // Cancel the reservation to free up the time slot
  if (payment.reservation_id) {
    const reservationRecord = normalizeReservation(payment.reservations)
    const reservationMetadata = reservationRecord?.metadata || {}

    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Payment failed',
        metadata: {
          ...reservationMetadata,
          cancelled_by_system: true,
          payment_failed_event: {
            id: eventId,
            code: failureCode,
            message: failureMessage,
            processedAt: failureAt,
          },
        }
      })
      .eq('id', payment.reservation_id)

    console.log('Reservation cancelled due to failed payment:', payment.reservation_id)
  }

  try {
    revalidatePath('/reservations')
    revalidatePath('/bookings')
  } catch (e) {
    console.warn('RevalidatePath failed in webhook:', e)
  }

  console.log('Reservation cancelled due to payment failure:', payment.reservation_id)
}
