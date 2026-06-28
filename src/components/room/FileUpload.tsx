'use client'

import { useState, useRef, DragEvent } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  roomId: string
  uploadEnabled: boolean
}

export default function FileUpload({ roomId, uploadEnabled }: FileUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  if (!uploadEnabled) return null

  async function uploadFiles(files: File[]) {
    setError('')
    setUploading(true)
    setProgress(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

      if (!user) {
        setError('You must be logged in')
        return
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`)

        const storagePath = `${roomId}/${Date.now()}_${file.name}`

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('room-files')
          .upload(storagePath, file)

        if (storageError) {
          setError(`Failed to upload ${file.name}: ${storageError.message}`)
          continue
        }

        // Insert file record in the database
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            room_id: roomId,
            uploader_id: user.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            storage_path: storagePath,
            is_deleted: false,
          })

        if (dbError) {
          setError(`Failed to save record for ${file.name}: ${dbError.message}`)
        }
      }

      setProgress('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files))
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files))
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="mb-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-3 text-sm">
          {error}
        </div>
      )}

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
          ${dragOver
            ? 'skeuo-inset border-blue-400 text-blue-500' 
            : 'skeuo-button'
          }
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <>
            <div className="flex justify-center mb-2"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload File</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{progress}</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-2"><UploadCloud className="w-8 h-8 text-gray-400" /></div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Drop files here or click to upload
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">Any file type supported</p>
          </>
        )}
      </div>
    </div>
  )
}
