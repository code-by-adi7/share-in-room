'use client'

import { createClient } from '@/lib/supabase/client'

interface FileDownloadProps {
  storagePath: string
  fileName: string
}

export default function FileDownload({ storagePath, fileName }: FileDownloadProps) {
  async function handleDownload() {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('room-files')
      .download(storagePath)

    if (error || !data) {
      alert('Download failed: ' + (error?.message || 'Unknown error'))
      return
    }

    // Create a download link
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="text-blue-600 hover:text-blue-700 text-sm font-medium shrink-0"
    >
      Download
    </button>
  )
}
