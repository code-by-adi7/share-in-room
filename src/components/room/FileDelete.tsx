'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FileDeleteProps {
  fileId: string
  storagePath: string
}

export default function FileDelete({ fileId, storagePath }: FileDeleteProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return

    setDeleting(true)
    const supabase = createClient()

    // 1. Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('room-files')
      .remove([storagePath])

    if (storageError) {
      alert('Failed to delete file from storage: ' + storageError.message)
      setDeleting(false)
      return
    }

    // 2. Soft-delete the database record
    const { data, error: dbError } = await supabase
      .from('files')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', fileId)
      .select()

    if (dbError) {
      alert('Failed to update file record: ' + dbError.message)
    } else if (!data || data.length === 0) {
      alert('Database update blocked by Security Policies! Please run the SQL command provided in the chat.')
    }

    setDeleting(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 disabled:opacity-50 transition"
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}
