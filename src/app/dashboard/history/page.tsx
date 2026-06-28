import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TransitionLink from '@/components/ui/TransitionLink'
import { Clock, Search } from 'lucide-react'

type HistoryEntry = {
  id: string
  last_entry_at: string
  rooms: {
    id: string
    name: string
    is_deleted: boolean
  } | null
}

type VisibleHistoryEntry = HistoryEntry & {
  rooms: NonNullable<HistoryEntry['rooms']>
}

function hasVisibleRoom(entry: HistoryEntry): entry is VisibleHistoryEntry {
  return entry.rooms !== null && !entry.rooms.is_deleted
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('history')
    .select(`
      *,
      rooms:room_id (
        id,
        name,
        is_deleted
      )
    `)
    .eq('account_id', user.id)
    .order('last_entry_at', { ascending: false })
  const historyEntries = (data || []) as HistoryEntry[]
  const visibleHistoryEntries = historyEntries.filter(hasVisibleRoom)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 transition mb-6 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2"><Clock className="w-6 h-6 text-purple-500" /> History</h1>
          <p className="text-gray-400 text-sm mb-6">Rooms you have previously visited</p>

          {(!historyEntries || historyEntries.length === 0) ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="flex justify-center mb-4"><Search className="w-12 h-12 text-gray-300" /></div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">No history yet</h2>
              <p className="text-gray-400 text-sm mb-4">Join a room to start building your history</p>
              <Link
                href="/dashboard/join-room"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                Join a Room
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleHistoryEntries.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                  <div className="flex justify-center mb-4"><Search className="w-12 h-12 text-gray-300" /></div>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">No history yet</h2>
                  <p className="text-gray-400 text-sm mb-4">Join a room to start building your history</p>
                  <Link
                    href="/dashboard/join-room"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                  >
                    Join a Room
                  </Link>
                </div>
              ) : (
                visibleHistoryEntries
                  .map((entry) => {
                    const room = entry.rooms

                    return (
                      <div
                        key={entry.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                              {room.name}
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">
                              Last visited {new Date(entry.last_entry_at).toLocaleDateString()} at{' '}
                              {new Date(entry.last_entry_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <TransitionLink
                            href={`/dashboard/room/${room.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            loadingMessage="Rejoining Room..."
                          >
                            Rejoin →
                          </TransitionLink>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
