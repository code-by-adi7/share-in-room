'use client'

import { useRouter } from 'next/navigation'
import { logoutUser } from '@/lib/services/auth.service'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await logoutUser()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 py-2 rounded-lg transition text-sm"
    >
      Log out
    </button>
  )
}