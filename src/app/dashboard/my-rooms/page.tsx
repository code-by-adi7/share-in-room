import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TransitionLink from '@/components/ui/TransitionLink'
import { Folder } from 'lucide-react'

export default async function MyRoomsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/auth/login')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Folder className="w-6 h-6 text-amber-500" /> My Rooms
              </h1>
              <p className="text-gray-400 text-sm mt-1">Rooms you have created</p>
            </div>
            <Link
              href="/dashboard/create-room"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
            >
              + New Room
            </Link>
          </div>

          {(!rooms || rooms.length === 0) ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <div className="flex justify-center mb-4">
                <Folder className="w-12 h-12 text-gray-300" />
              </div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">No rooms yet</h2>
              <p className="text-gray-400 text-sm mb-4">Create your first room to start sharing files</p>
              <Link
                href="/dashboard/create-room"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                Create Room
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <TransitionLink
                  key={room.id}
                  href={`/dashboard/room/${room.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition"
                  loadingMessage="Opening Room..."
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-800 dark:text-gray-100">{room.name}</h2>
                      <p className="text-gray-400 text-xs mt-1">
                        {room.total_visitor_count} visitor{room.total_visitor_count !== 1 ? 's' : ''} · Created {new Date(room.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${room.upload_enabled ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {room.upload_enabled ? 'Uploads on' : 'Uploads off'}
                      </span>
                      <span className="text-gray-300 text-lg">→</span>
                    </div>
                  </div>
                </TransitionLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
