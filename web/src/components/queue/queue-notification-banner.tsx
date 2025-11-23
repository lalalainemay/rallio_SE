'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'

interface QueueNotification {
  id: string
  courtId: string
  courtName: string
  venueName: string
  position: number
  message: string
  type: 'turn-soon' | 'turn-now' | 'position-update'
}

/**
 * Queue notification banner that appears at the top of pages
 * Shows when user's turn is coming up or position changes
 * 
 * TODO: Connect to WebSocket for real-time notifications
 * TODO: Connect to push notification system
 */
export function QueueNotificationBanner() {
  const [notifications, setNotifications] = useState<QueueNotification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    // TODO: Subscribe to WebSocket queue updates
    // const ws = new WebSocket('wss://api.rallio.com/ws/queue/notifications')
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data)
    //   setNotifications(prev => [...prev, notification])
    // }
    
    // Mock notification for demo (remove when backend ready)
    // setNotifications([
    //   {
    //     id: 'notif-1',
    //     courtId: 'court-1',
    //     courtName: 'Championship Court 1',
    //     venueName: 'Elite Sports Arena',
    //     position: 2,
    //     message: "You're next! Get ready to play.",
    //     type: 'turn-soon'
    //   }
    // ])
  }, [])

  const activeNotifications = notifications.filter(n => !dismissed.has(n.id))

  if (activeNotifications.length === 0) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 pt-4 md:top-16">
      <div className="container mx-auto max-w-4xl space-y-2">
        {activeNotifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-top duration-300"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-white">
                  {notification.type === 'turn-now' && "It's Your Turn!"}
                  {notification.type === 'turn-soon' && "Almost Your Turn"}
                  {notification.type === 'position-update' && "Position Updated"}
                </h4>
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, notification.id]))}
                  className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-white/90 mb-2">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-white/80">
                <span>{notification.courtName}</span>
                <span>•</span>
                <span>Position #{notification.position}</span>
              </div>
            </div>

            <Link
              href={`/queue/${notification.courtId}`}
              className="px-4 py-2 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm whitespace-nowrap flex-shrink-0"
            >
              View Queue
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
