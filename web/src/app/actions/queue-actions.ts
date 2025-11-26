'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Queue Management Server Actions
 * Handles queue session operations for the queue system
 */

export interface QueueSessionData {
  id: string
  courtId: string
  courtName: string
  venueName: string
  venueId: string
  status: 'draft' | 'open' | 'active' | 'paused' | 'closed' | 'cancelled'
  currentPlayers: number
  maxPlayers: number
  costPerGame: number
  startTime: Date
  endTime: Date
  mode: 'casual' | 'competitive'
  gameFormat: 'singles' | 'doubles' | 'mixed'
}

export interface QueueParticipantData {
  id: string
  userId: string
  playerName: string
  avatarUrl?: string
  skillLevel: number
  position: number
  joinedAt: Date
  gamesPlayed: number
  gamesWon: number
  status: 'waiting' | 'playing' | 'completed' | 'left'
  amountOwed: number
  paymentStatus: 'unpaid' | 'partial' | 'paid'
}

/**
 * Fetch queue session details by court ID
 */
export async function getQueueDetails(courtId: string) {
  console.log('[getQueueDetails] 🔍 Fetching queue for court:', courtId)

  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[getQueueDetails] ❌ User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    // Find active or open queue session for this court
    const { data: session, error: sessionError } = await supabase
      .from('queue_sessions')
      .select(`
        *,
        courts (
          name,
          venues (
            id,
            name
          )
        )
      `)
      .eq('court_id', courtId)
      .in('status', ['open', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionError || !session) {
      console.log('[getQueueDetails] ℹ️ No active queue found for court')
      return { success: true, queue: null }
    }

    // Get all participants in this session
    const { data: participants, error: participantsError } = await supabase
      .from('queue_participants')
      .select(`
        *,
        user:user_id!inner (
          id,
          display_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('queue_session_id', session.id)
      .is('left_at', null)
      .order('joined_at', { ascending: true })

    if (participantsError) {
      console.error('[getQueueDetails] ❌ Failed to fetch participants:', participantsError)
      return { success: false, error: 'Failed to fetch participants' }
    }

    // Get player skill levels separately (since we can't nested join)
    const playerIds = participants?.map((p: any) => p.user_id) || []
    const { data: players } = await supabase
      .from('players')
      .select('user_id, skill_level')
      .in('user_id', playerIds)

    const playerSkillMap = new Map(players?.map((p: any) => [p.user_id, p.skill_level]) || [])

    // Calculate positions and user position
    const formattedParticipants: QueueParticipantData[] = (participants || []).map((p: any, index: number) => ({
      id: p.id,
      userId: p.user_id,
      playerName: p.user?.display_name || `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || 'Unknown Player',
      avatarUrl: p.user?.avatar_url,
      skillLevel: playerSkillMap.get(p.user_id) || 5,
      position: index + 1,
      joinedAt: new Date(p.joined_at),
      gamesPlayed: p.games_played || 0,
      gamesWon: p.games_won || 0,
      status: p.status,
      amountOwed: parseFloat(p.amount_owed || '0'),
      paymentStatus: p.payment_status,
    }))

    const userParticipant = formattedParticipants.find(p => p.userId === user.id)
    const userPosition = userParticipant ? userParticipant.position : null

    // Calculate estimated wait time (15 min per game × position)
    const estimatedWaitTime = userPosition ? userPosition * 15 : formattedParticipants.length * 15

    const queueData: QueueSessionData & {
      players: QueueParticipantData[]
      userPosition: number | null
      estimatedWaitTime: number
    } = {
      id: session.id,
      courtId: session.court_id,
      courtName: session.courts?.name || 'Unknown Court',
      venueName: session.courts?.venues?.name || 'Unknown Venue',
      venueId: session.courts?.venues?.id || '',
      status: session.status,
      currentPlayers: session.current_players || formattedParticipants.length,
      maxPlayers: session.max_players || 12,
      costPerGame: parseFloat(session.cost_per_game || '0'),
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time),
      mode: session.mode,
      gameFormat: session.game_format,
      players: formattedParticipants,
      userPosition,
      estimatedWaitTime,
    }

    console.log('[getQueueDetails] ✅ Queue fetched successfully:', {
      sessionId: queueData.id,
      playerCount: queueData.players.length,
      userPosition,
    })

    return { success: true, queue: queueData }
  } catch (error: any) {
    console.error('[getQueueDetails] ❌ Error:', error)
    return { success: false, error: error.message || 'Failed to fetch queue' }
  }
}

/**
 * Join a queue session
 */
export async function joinQueue(sessionId: string) {
  console.log('[joinQueue] 🚀 Joining queue session:', sessionId)

  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[joinQueue] ❌ User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    // Check if session exists and is joinable
    const { data: session, error: sessionError } = await supabase
      .from('queue_sessions')
      .select('*, courts(id)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('[joinQueue] ❌ Session not found:', sessionError)
      return { success: false, error: 'Queue session not found' }
    }

    if (!['open', 'active'].includes(session.status)) {
      return { success: false, error: 'Queue is not accepting new players' }
    }

    // Check if queue is full
    const { count: currentCount } = await supabase
      .from('queue_participants')
      .select('*', { count: 'exact', head: true })
      .eq('queue_session_id', sessionId)
      .is('left_at', null)

    if (currentCount && currentCount >= session.max_players) {
      return { success: false, error: 'Queue is full' }
    }

    // Check if user is already in queue
    const { data: existing } = await supabase
      .from('queue_participants')
      .select('*')
      .eq('queue_session_id', sessionId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    if (existing) {
      return { success: false, error: 'Already in queue' }
    }

    // Add user to queue
    const { data: participant, error: insertError } = await supabase
      .from('queue_participants')
      .insert({
        queue_session_id: sessionId,
        user_id: user.id,
        status: 'waiting',
        payment_status: 'unpaid',
        amount_owed: 0,
      })
      .select()
      .single()

    if (insertError || !participant) {
      console.error('[joinQueue] ❌ Failed to join queue:', insertError)
      return { success: false, error: 'Failed to join queue' }
    }

    console.log('[joinQueue] ✅ Successfully joined queue')

    // Revalidate queue pages
    revalidatePath(`/queue/${session.courts.id}`)
    revalidatePath('/queue')

    return { success: true, participant }
  } catch (error: any) {
    console.error('[joinQueue] ❌ Error:', error)
    return { success: false, error: error.message || 'Failed to join queue' }
  }
}

/**
 * Leave a queue session
 */
export async function leaveQueue(sessionId: string) {
  console.log('[leaveQueue] 🚪 Leaving queue session:', sessionId)

  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[leaveQueue] ❌ User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    // Get participant record
    const { data: participant, error: fetchError } = await supabase
      .from('queue_participants')
      .select('*, queue_sessions(courts(id))')
      .eq('queue_session_id', sessionId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    if (fetchError || !participant) {
      console.error('[leaveQueue] ❌ Not in queue:', fetchError)
      return { success: false, error: 'Not in queue' }
    }

    // Check if user owes money
    const gamesPlayed = participant.games_played || 0
    const amountOwed = parseFloat(participant.amount_owed || '0')

    if (gamesPlayed > 0 && amountOwed > 0 && participant.payment_status !== 'paid') {
      console.log('[leaveQueue] ⚠️ User owes payment:', { gamesPlayed, amountOwed })
      return {
        success: false,
        error: 'Payment required',
        requiresPayment: true,
        amountOwed,
        gamesPlayed,
      }
    }

    // Mark as left
    const { error: updateError } = await supabase
      .from('queue_participants')
      .update({
        left_at: new Date().toISOString(),
        status: 'left',
      })
      .eq('id', participant.id)

    if (updateError) {
      console.error('[leaveQueue] ❌ Failed to leave queue:', updateError)
      return { success: false, error: 'Failed to leave queue' }
    }

    console.log('[leaveQueue] ✅ Successfully left queue')

    // Revalidate queue pages
    const courtId = participant.queue_sessions?.courts?.id
    if (courtId) {
      revalidatePath(`/queue/${courtId}`)
    }
    revalidatePath('/queue')

    return { success: true }
  } catch (error: any) {
    console.error('[leaveQueue] ❌ Error:', error)
    return { success: false, error: error.message || 'Failed to leave queue' }
  }
}

/**
 * Get all queue sessions where user is a participant
 */
export async function getMyQueues() {
  console.log('[getMyQueues] 🔍 Fetching user queues')

  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[getMyQueues] ❌ User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    // Get all active queue participations
    const { data: participations, error: participationsError } = await supabase
      .from('queue_participants')
      .select(`
        *,
        queue_sessions!inner (
          *,
          courts (
            id,
            name,
            venues (
              id,
              name
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .is('left_at', null)
      .in('queue_sessions.status', ['open', 'active'])
      .order('joined_at', { ascending: false })

    if (participationsError) {
      console.error('[getMyQueues] ❌ Failed to fetch queues:', participationsError)
      return { success: false, error: 'Failed to fetch queues' }
    }

    const queues = await Promise.all(
      (participations || []).map(async (p: any) => {
        // Get participant count for this session
        const { count } = await supabase
          .from('queue_participants')
          .select('*', { count: 'exact', head: true })
          .eq('queue_session_id', p.queue_session_id)
          .is('left_at', null)

        // Get user's position
        const { data: earlierParticipants } = await supabase
          .from('queue_participants')
          .select('id')
          .eq('queue_session_id', p.queue_session_id)
          .is('left_at', null)
          .lt('joined_at', p.joined_at)

        const position = (earlierParticipants?.length || 0) + 1
        const estimatedWaitTime = position * 15 // 15 min per position

        return {
          id: p.queue_session_id,
          courtId: p.queue_sessions.court_id,
          courtName: p.queue_sessions.courts?.name || 'Unknown Court',
          venueName: p.queue_sessions.courts?.venues?.name || 'Unknown Venue',
          venueId: p.queue_sessions.courts?.venues?.id || '',
          status: p.queue_sessions.status,
          players: [],
          userPosition: position,
          estimatedWaitTime,
          maxPlayers: p.queue_sessions.max_players,
          currentPlayers: count || 0,
        }
      })
    )

    console.log('[getMyQueues] ✅ Fetched queues:', queues.length)

    return { success: true, queues }
  } catch (error: any) {
    console.error('[getMyQueues] ❌ Error:', error)
    return { success: false, error: error.message || 'Failed to fetch queues' }
  }
}

/**
 * Get nearby active queue sessions
 */
export async function getNearbyQueues(latitude?: number, longitude?: number) {
  console.log('[getNearbyQueues] 🔍 Fetching nearby queues')

  try {
    const supabase = await createClient()

    // Get active queue sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('queue_sessions')
      .select(`
        *,
        courts (
          id,
          name,
          venues (
            id,
            name,
            latitude,
            longitude
          )
        )
      `)
      .in('status', ['open', 'active'])
      .eq('is_public', true)
      .order('start_time', { ascending: true })
      .limit(20)

    if (sessionsError) {
      console.error('[getNearbyQueues] ❌ Failed to fetch sessions:', sessionsError)
      return { success: false, error: 'Failed to fetch queues' }
    }

    const queues = await Promise.all(
      (sessions || []).map(async (session: any) => {
        // Get participant count
        const { count } = await supabase
          .from('queue_participants')
          .select('*', { count: 'exact', head: true })
          .eq('queue_session_id', session.id)
          .is('left_at', null)

        const currentPlayers = count || 0
        const estimatedWaitTime = currentPlayers * 15

        return {
          id: session.id,
          courtId: session.court_id,
          courtName: session.courts?.name || 'Unknown Court',
          venueName: session.courts?.venues?.name || 'Unknown Venue',
          venueId: session.courts?.venues?.id || '',
          status: session.status,
          players: [],
          userPosition: null,
          estimatedWaitTime,
          maxPlayers: session.max_players,
          currentPlayers,
        }
      })
    )

    console.log('[getNearbyQueues] ✅ Fetched queues:', queues.length)

    return { success: true, queues }
  } catch (error: any) {
    console.error('[getNearbyQueues] ❌ Error:', error)
    return { success: false, error: error.message || 'Failed to fetch nearby queues' }
  }
}

/**
 * Calculate amount owed by a participant
 */
export async function calculateQueuePayment(sessionId: string) {
  console.log('[calculateQueuePayment] 💰 Calculating payment')

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get participant and session details
    const { data: participant, error: participantError } = await supabase
      .from('queue_participants')
      .select(`
        *,
        queue_sessions (
          cost_per_game,
          courts (
            name,
            venues (
              name
            )
          )
        )
      `)
      .eq('queue_session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return { success: false, error: 'Participant not found' }
    }

    const costPerGame = parseFloat(participant.queue_sessions.cost_per_game || '0')
    const gamesPlayed = participant.games_played || 0
    const totalOwed = costPerGame * gamesPlayed
    const amountPaid = 0 // Track separately if needed

    return {
      success: true,
      payment: {
        participantId: participant.id,
        sessionId: sessionId,
        gamesPlayed,
        costPerGame,
        totalOwed,
        amountPaid,
        remainingBalance: totalOwed - amountPaid,
        courtName: participant.queue_sessions.courts?.name || 'Unknown Court',
        venueName: participant.queue_sessions.courts?.venues?.name || 'Unknown Venue',
      },
    }
  } catch (error: any) {
    console.error('[calculateQueuePayment] ❌ Error:', error)
    return { success: false, error: error.message || 'Failed to calculate payment' }
  }
}
