'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VisitorManagement({ memberships, roomId }: { memberships: any[], roomId: string }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function toggleUploadPermission(membershipId: string, currentVal: boolean) {
    setUpdating(membershipId)
    const { error } = await supabase
      .from('memberships')
      .update({ 
        upload_permission: !currentVal, 
        individually_restricted: true // Marks that the author manually overrode the default
      })
      .eq('id', membershipId)
    
    if (error) {
      alert('Failed to update permission')
    }
    setUpdating(null)
    router.refresh()
  }

  async function removeVisitor(membershipId: string) {
    if (!confirm('Are you sure you want to remove this visitor? They will need the password to join again.')) return
    
    setUpdating(membershipId)
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId)
    
    if (error) {
      alert('Failed to remove visitor')
    }
    setUpdating(null)
    router.refresh()
  }

  if (memberships.length === 0) {
    return (
      <div className="skeuo-box p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-2">Visitors</h2>
        <p className="text-sm text-gray-400">No visitors have joined yet.</p>
      </div>
    )
  }

  return (
    <div className="skeuo-box p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Visitor Management</h2>
      <div className="space-y-3">
        {memberships.map((m) => (
          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 skeuo-inset">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100 block">
                {m.profile_name} <span className="text-xs text-gray-500 font-normal ml-1">(Alias #{m.alias_number})</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Joined: {new Date(m.first_entry_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleUploadPermission(m.id, m.upload_permission)}
                disabled={updating === m.id}
                className={`skeuo-button text-xs px-4 py-2 font-bold transition ${m.upload_permission ? 'text-emerald-500 hover:text-emerald-400' : 'text-red-500 hover:text-red-400'} ${updating === m.id ? 'opacity-50' : ''}`}
              >
                {m.upload_permission ? 'Can Upload' : 'Upload Blocked'}
              </button>
              <button
                onClick={() => removeVisitor(m.id)}
                disabled={updating === m.id}
                className={`skeuo-button text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 font-bold transition ${updating === m.id ? 'opacity-50' : ''}`}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
