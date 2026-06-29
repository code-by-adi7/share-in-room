import { createClient } from '@/lib/supabase/server'
import { Users, File, FileText } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import TransitionLink from '@/components/ui/TransitionLink'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import FileUpload from '@/components/room/FileUpload'
import FileDownload from '@/components/room/FileDownload'
import RoomPresence from '@/components/room/RoomPresence'
import RoomSettings from '@/components/room/RoomSettings'
import VisitorManagement from '@/components/room/VisitorManagement'

import FileDelete from '@/components/room/FileDelete'

type Membership = {
  id: string
  account_id: string
  room_id: string
  upload_permission: boolean
  individually_restricted: boolean
  alias_number: number
  first_entry_at: string
}

type Profile = {
  id: string
  name: string
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/auth/login')

  // Server-rendered freshness cutoff for presence queries.
  // eslint-disable-next-line react-hooks/purity
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const [
    { data: room },
    { data: membership },
    { data: files },
    { count: activeCount }
  ] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', id).eq('is_deleted', false).single(),
    supabase.from('memberships').select('*').eq('account_id', user.id).eq('room_id', id).single(),
    supabase.from('files').select('*').eq('room_id', id).eq('is_deleted', false).order('uploaded_at', { ascending: false }),
    supabase.from('active_room_sessions').select('*', { count: 'exact', head: true }).eq('room_id', id).gt('last_heartbeat', twoMinutesAgo)
  ])

  if (!room) notFound()

  const isAuthor = room.author_id === user.id

  if (!membership && !isAuthor) {
    redirect('/dashboard/join-room')
  }

  // Determine if this user can upload
  const canUpload = room.upload_enabled && (
    isAuthor ||
    (membership && membership.upload_permission && !membership.individually_restricted)
  )

  // Fetch all memberships if owner
  let allMemberships: (Membership & { profile_name: string })[] = []
  if (isAuthor) {
    const { data: mems } = await supabase
      .from('memberships')
      .select('*')
      .eq('room_id', id)
      .order('first_entry_at', { ascending: true })
    
    if (mems && mems.length > 0) {
      const typedMemberships = mems as Membership[]
      const accountIds = typedMemberships.map((m) => m.account_id)
      let profs: Profile[] = []
      
      if (accountIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', accountIds)
        profs = (data || []) as Profile[]
      }
      
      const profMap = profs.reduce<Record<string, string>>((acc, p) => {
        acc[p.id] = p.name
        return acc
      }, {})

      allMemberships = typedMemberships
        .filter((m) => m.account_id !== user.id)
        .map((m) => ({
          ...m,
          profile_name: profMap[m.account_id] || 'Unknown User'
        }))
    }
  }

  // Fetch uploader profiles
  const uploaderIds = Array.from(new Set(files?.map(f => f.uploader_id).filter(Boolean) || []))
  let uploaderProfs: Profile[] = []
  if (uploaderIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', uploaderIds)
    uploaderProfs = (data || []) as Profile[]
  }
  
  const uploaderMap = uploaderProfs.reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = p.name
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <RoomPresence roomId={id} accountId={user.id} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <TransitionLink
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600 transition mb-6 inline-flex items-center gap-1"
          loadingMessage="Returning to Dashboard..."
        >
          ← Back to Dashboard
        </TransitionLink>

        <div className="mt-4">
          {/* Room Header */}
          <div className="skeuo-box p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-0 text-center sm:text-left">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
{room.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {room.total_visitor_count} total visitor{room.total_visitor_count !== 1 ? 's' : ''}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {activeCount || 1} online now
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="skeuo-button rounded-full">
                  <ThemeToggle />
                </div>
                {isAuthor && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-semibold tracking-wide uppercase">
                    Owner
                  </span>
                )}
                
                {isAuthor ? (
                  <RoomSettings roomId={id} initialUploadEnabled={room.upload_enabled} />
                ) : (
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${room.upload_enabled ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                    {room.upload_enabled ? 'Uploads on' : 'Uploads off'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Owner Tools */}
          {isAuthor && <VisitorManagement memberships={allMemberships} roomId={id} />}

          {/* File Upload */}
          <FileUpload roomId={id} uploadEnabled={!!canUpload} />

          {/* Files */}
          <div className="skeuo-box p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Files</h2>
              <span className="text-xs text-gray-400">{files?.length || 0} file{(files?.length || 0) !== 1 ? 's' : ''}</span>
            </div>

            {(!files || files.length === 0) ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4"><File className="w-12 h-12 text-gray-300" /></div>
                <p className="text-gray-400 text-sm">No files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => {
                  const uploaderName = uploaderMap[file.uploader_id] || 'Unknown Uploader'
                  return (
                    <div
                      key={file.id}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 skeuo-inset transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                        <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{file.file_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-medium text-gray-700 dark:text-gray-200 break-all">
                              {file.uploader_id === room.author_id ? 'Owner' : uploaderName}
                            </span> · {(file.file_size / 1024).toFixed(1)} KB · {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {isAuthor && (
                          <FileDelete fileId={file.id} storagePath={file.storage_path} />
                        )}
                        <FileDownload storagePath={file.storage_path} fileName={file.file_name} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
