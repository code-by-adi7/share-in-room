'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CryptoJS from 'crypto-js'
import { containsSQLInjection } from '@/lib/security'
import { getErrorMessage } from '@/lib/errors'
import FullScreenLoader from '@/components/ui/FullScreenLoader'
import { PlusCircle } from 'lucide-react'

export default function CreateRoomPage() {
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

      const { error: insertError } = await supabase
        .from('rooms')
        .insert({
          name: roomName,
          password_hash: passwordHash,
          author_id: user.id,
          upload_enabled: true,
          total_visitor_count: 0,
          is_deleted: false,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      window.location.href = '/dashboard/my-rooms'
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create room'))
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <FullScreenLoader message="Creating Room..." />}
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
            <PlusCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Create New Room</h1>
          <p className="text-gray-400 text-sm mb-6">Start a new file sharing room</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room Name
              </label>
              <input
                type="text"
                autoComplete="off"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                placeholder="E.g. Design Assets"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={18}
                placeholder="Set a secure password"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Others will need this password to join</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  )
}
