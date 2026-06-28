'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RoomSettings({ roomId, initialUploadEnabled }: { roomId: string, initialUploadEnabled: boolean }) {
  const [uploadEnabled, setUploadEnabled] = useState(initialUploadEnabled)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  async function toggleUpload() {
    setUpdating(true)
    const newValue = !uploadEnabled
    const supabase = createClient()
    
    const { error } = await supabase
      .from('rooms')
      .update({ upload_enabled: newValue })
      .eq('id', roomId)

    if (!error) {
      setUploadEnabled(newValue)
      router.refresh()
    } else {
      alert(`Failed to update room settings: ${error.message}`)
    }
    setUpdating(false)
  }

  async function deleteRoom() {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return
    
    setUpdating(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)

    if (!error) {
      window.location.href = '/dashboard/my-rooms'
    } else {
      alert(`Failed to delete room: ${error.message}`)
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleUpload}
        disabled={updating}
        className={`skeuo-button text-xs px-4 py-2 font-bold transition cursor-pointer 
          ${uploadEnabled 
            ? 'text-emerald-500 hover:text-emerald-400' 
            : 'text-red-500 hover:text-red-400'
          } ${updating ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploadEnabled ? '✅ Uploads Enabled (Click to Disable)' : '🚫 Uploads Disabled (Click to Enable)'}
      </button>
      <button
        onClick={deleteRoom}
        disabled={updating}
        className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer bg-red-600 text-white hover:bg-red-700 border border-red-700 ${updating ? 'opacity-50 pointer-events-none' : ''}`}
      >
        🗑️ Delete Room
      </button>
    </div>
  )
}
