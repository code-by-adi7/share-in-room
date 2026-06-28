'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RoomPresence({ roomId, accountId }: { roomId: string, accountId: string }) {
  useEffect(() => {
    const supabase = createClient()
    let sessionId: string | null = null

    async function initSession() {
      // Clean up any stale sessions for this user in this room first
      await supabase
        .from('active_room_sessions')
        .delete()
        .eq('room_id', roomId)
        .eq('account_id', accountId)

      // Create new session
      const { data } = await supabase
        .from('active_room_sessions')
        .insert({ room_id: roomId, account_id: accountId })
        .select('id')
        .single()
      
      if (data) {
        sessionId = data.id
      }
    }

    initSession()

    // Send heartbeat every 15 seconds
    const interval = setInterval(() => {
      if (sessionId) {
        supabase
          .from('active_room_sessions')
          .update({ last_heartbeat: new Date().toISOString() })
          .eq('id', sessionId)
          .then()
      }
    }, 15000)

    return () => {
      clearInterval(interval)
      if (sessionId) {
        supabase
          .from('active_room_sessions')
          .delete()
          .eq('id', sessionId)
          .then()
      }
    }
  }, [roomId, accountId])

  return null
}
