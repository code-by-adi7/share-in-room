'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from '@/lib/services/auth.service'
import { containsSQLInjection } from '@/lib/security'
import { getErrorMessage } from '@/lib/errors'
import FullScreenLoader from '@/components/ui/FullScreenLoader'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (containsSQLInjection(name) || containsSQLInjection(email) || containsSQLInjection(password)) {
      setError('Invalid characters detected. SQL queries are not allowed.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await registerUser(name, email, password)
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <FullScreenLoader message="Creating Account..." />}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center px-4">
        <ScrollReveal delay={0.1} className="w-full max-w-md">
        <div className="skeuo-box p-10">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight mb-2">Create Account</h1>
        <p className="text-gray-400 text-sm mb-6">Join RoomShare to start sharing files</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              autoComplete="off"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="Your name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={18}
              placeholder="6 to 18 characters"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="skeuo-button w-full text-blue-600 dark:text-blue-400 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Log in
          </Link>
        </p>
        </div>
        </ScrollReveal>
      </div>
    </>
  )
}
