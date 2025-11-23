'use client'

import { useState, useEffect } from 'react'

export interface QueuePlayer {
  id: string
  name: string
  avatarUrl?: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  position: number
  joinedAt: Date
}

export interface QueueSession {
  id: string
  courtId: string
  courtName: string
  venueName: string
  venueId: string
  status: 'waiting' | 'active' | 'completed'
  players: QueuePlayer[]
  userPosition: number | null
  estimatedWaitTime: number // in minutes
  maxPlayers: number
  currentMatch?: {
    courtName: string
    players: string[]
    startTime: Date
    duration: number
  }
}

/**
 * Mock hook for queue state management
 * TODO: Replace with real API calls when backend is ready
 * 
 * Backend Integration Points:
 * - GET /api/queue/:courtId - Fetch queue details
 * - POST /api/queue/:courtId/join - Join queue
 * - DELETE /api/queue/:courtId/leave - Leave queue
 * - WebSocket connection for live updates
 */
export function useQueue(courtId: string) {
  const [queue, setQueue] = useState<QueueSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchQueue = async () => {
    //   try {
    //     const response = await fetch(`/api/queue/${courtId}`)
    //     const data = await response.json()
    //     setQueue(data)
    //   } catch (err) {
    //     setError('Failed to load queue')
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // fetchQueue()

    // Mock data for development
    setTimeout(() => {
      setQueue({
        id: `queue-${courtId}`,
        courtId,
        courtName: 'Championship Court 1',
        venueName: 'Elite Sports Arena',
        venueId: 'venue-1',
        status: 'active',
        players: [
          {
            id: '1',
            name: 'John Reyes',
            skillLevel: 'advanced',
            position: 1,
            joinedAt: new Date(Date.now() - 15 * 60000),
          },
          {
            id: '2',
            name: 'Maria Santos',
            skillLevel: 'intermediate',
            position: 2,
            joinedAt: new Date(Date.now() - 10 * 60000),
          },
          {
            id: '3',
            name: 'Carlos Dela Cruz',
            skillLevel: 'expert',
            position: 3,
            joinedAt: new Date(Date.now() - 5 * 60000),
          },
        ],
        userPosition: null, // null = user not in queue
        estimatedWaitTime: 25,
        maxPlayers: 8,
      })
      setIsLoading(false)
    }, 500)
  }, [courtId])

  const joinQueue = async () => {
    // TODO: Replace with actual API call
    // try {
    //   await fetch(`/api/queue/${courtId}/join`, { method: 'POST' })
    //   // Refresh queue data
    // } catch (err) {
    //   setError('Failed to join queue')
    // }

    // Mock join
    if (queue) {
      const newPosition = queue.players.length + 1
      setQueue({
        ...queue,
        players: [
          ...queue.players,
          {
            id: 'current-user',
            name: 'You',
            skillLevel: 'intermediate',
            position: newPosition,
            joinedAt: new Date(),
          },
        ],
        userPosition: newPosition,
      })
    }
  }

  const leaveQueue = async () => {
    // TODO: Replace with actual API call
    // try {
    //   await fetch(`/api/queue/${courtId}/leave`, { method: 'DELETE' })
    //   // Refresh queue data
    // } catch (err) {
    //   setError('Failed to leave queue')
    // }

    // Mock leave
    if (queue && queue.userPosition) {
      setQueue({
        ...queue,
        players: queue.players.filter((p) => p.id !== 'current-user'),
        userPosition: null,
      })
    }
  }

  const refreshQueue = async () => {
    // TODO: Replace with actual API call
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }

  return {
    queue,
    isLoading,
    error,
    joinQueue,
    leaveQueue,
    refreshQueue,
  }
}

/**
 * Hook to fetch all active queues for the current user
 * TODO: Replace with real API when backend is ready
 * 
 * Backend Integration:
 * - GET /api/queue/my-queues - Fetch user's active queues
 */
export function useMyQueues() {
  const [queues, setQueues] = useState<QueueSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchMyQueues = async () => {
    //   const response = await fetch('/api/queue/my-queues')
    //   const data = await response.json()
    //   setQueues(data)
    //   setIsLoading(false)
    // }
    // fetchMyQueues()

    // Mock data
    setTimeout(() => {
      setQueues([
        {
          id: 'queue-1',
          courtId: 'court-1',
          courtName: 'Championship Court 1',
          venueName: 'Elite Sports Arena',
          venueId: 'venue-1',
          status: 'waiting',
          players: [],
          userPosition: 3,
          estimatedWaitTime: 15,
          maxPlayers: 8,
        },
        {
          id: 'queue-2',
          courtId: 'court-2',
          courtName: 'Practice Court A',
          venueName: 'Metro Badminton Center',
          venueId: 'venue-2',
          status: 'active',
          players: [],
          userPosition: 1,
          estimatedWaitTime: 5,
          maxPlayers: 6,
        },
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  return { queues, isLoading }
}

/**
 * Hook to fetch available queues near the user
 * TODO: Replace with real API when backend is ready
 * 
 * Backend Integration:
 * - GET /api/queue/nearby - Fetch nearby active queues
 */
export function useNearbyQueues() {
  const [queues, setQueues] = useState<QueueSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setQueues([
        {
          id: 'queue-3',
          courtId: 'court-3',
          courtName: 'Court 2',
          venueName: 'Elite Sports Arena',
          venueId: 'venue-1',
          status: 'waiting',
          players: [],
          userPosition: null,
          estimatedWaitTime: 10,
          maxPlayers: 8,
        },
        {
          id: 'queue-4',
          courtId: 'court-4',
          courtName: 'Premium Court',
          venueName: 'City Badminton Hub',
          venueId: 'venue-3',
          status: 'waiting',
          players: [],
          userPosition: null,
          estimatedWaitTime: 20,
          maxPlayers: 6,
        },
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  return { queues, isLoading }
}
