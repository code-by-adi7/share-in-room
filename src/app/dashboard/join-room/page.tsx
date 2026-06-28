'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CryptoJS from 'crypto-js'
import { containsSQLInjection } from '@/lib/security'
import { getErrorMessage } from '@/lib/errors'
import FullScreenLoader from '@/components/ui/FullScreenLoader'
import { LogIn } from 'lucide-react'

export default function JoinRoomPage() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (containsSQLInjection(roomName) || containsSQLInjection(password)) {
      setError('Invalid characters detected. SQL queries are not allowed.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        setError('You must be logged in')
        return
      }

      const passwordHash = CryptoJS.SHA256(password).toString()

      // Find the room by name
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id, password_hash')
        .eq('name', roomName)
        .eq('is_deleted', false)
        .single()

      if (roomError || !room) {
        setError('Room not found')
        setLoading(false)
        return
      }

      // Verify password
      if (room.password_hash !== passwordHash) {
        setError('Incorrect room password')
        setLoading(false)
        return
      }

      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('id')
        .eq('account_id', user.id)
        .eq('room_id', room.id)
        .single()

      if (!existingMembership) {
        // Join securely via RPC to bypass RLS for alias_number calculation
        const { error: joinError } = await supabase.rpc('join_room_securely', {
          target_room_id: room.id,
          target_account_id: user.id
        })

        if (joinError) throw joinError

        // Increment visitor count
        await supabase.rpc('increment_visitor_count', { room_id_input: room.id })
      }

      // Save to history
      const encryptedPassword = CryptoJS.AES.encrypt(password, user.id).toString()

      await supabase
        .from('history')
        .upsert({
          account_id: user.id,
          room_id: room.id,
          last_entry_at: new Date().toISOString(),
          encrypted_room_password: encryptedPassword,
        }, {
          onConflict: 'account_id,room_id',
        })

      router.push(`/dashboard/room/${room.id}`)
      router.refresh()
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to join room'))
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <FullScreenLoader message="Entering Room..." />}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 transition mb-6 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-4">
          <div className="skeuo-inset w-16 h-16 flex items-center justify-center rounded-full mb-4">
            <LogIn className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Join Room</h1>
          <p className="text-gray-400 text-sm mb-6">Enter a room with its name and password</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <input
                type="text"
                autoComplete="off"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                required
                placeholder="Enter the room name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter the room password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  )
}
