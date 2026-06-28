'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/services/auth.service'
import { containsSQLInjection } from '@/lib/security'
import { getErrorMessage } from '@/lib/errors'
import FullScreenLoader from '@/components/ui/FullScreenLoader'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [coolOff, setCoolOff] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0)

  useEffect(() => {
    const updateLockout = () => {
      const lockoutUntil = parseInt(localStorage.getItem('lockoutUntil') || '0', 10)
      if (lockoutUntil > Date.now()) {
        setLockoutRemaining(Math.ceil((lockoutUntil - Date.now()) / 1000))
      } else {
        if (lockoutUntil !== 0) {
          localStorage.removeItem('lockoutUntil')
          localStorage.removeItem('loginAttempts')
        }
        setLockoutRemaining(0)
      }
    }

    updateLockout()
    const interval = setInterval(updateLockout, 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lockoutRemaining > 0 || coolOff) return

    if (containsSQLInjection(email) || containsSQLInjection(password)) {
      setError('Invalid characters detected. SQL queries are not allowed.')
      return
    }

    setError('')
    setLoading(true)
    setCoolOff(true)

    setTimeout(() => setCoolOff(false), 2000)

    try {
      await loginUser(email, password)
      localStorage.removeItem('loginAttempts')
      localStorage.removeItem('lockoutUntil')
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10) + 1
      localStorage.setItem('loginAttempts', attempts.toString())

      if (attempts >= 5) {
        const lockoutTime = Date.now() + 15 * 60 * 1000
        localStorage.setItem('lockoutUntil', lockoutTime.toString())
        setLockoutRemaining(15 * 60)
      } else {
        setError(getErrorMessage(error, 'Incorrect email or password'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <FullScreenLoader message="Logging in..." />}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center px-4">
        <ScrollReveal delay={0.1} className="w-full max-w-md">
        <div className="skeuo-box p-10">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-gray-400 text-sm mb-6">Log in to your RoomShare account</p>

        {error && lockoutRemaining === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {lockoutRemaining > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            Too many failed attempts. Try again in {Math.floor(lockoutRemaining / 60)}:{(lockoutRemaining % 60).toString().padStart(2, '0')}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
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
              disabled={lockoutRemaining > 0}
              placeholder="you@example.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
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
              disabled={lockoutRemaining > 0}
              placeholder="Your password"
              className="skeuo-inset w-full px-4 py-3 text-gray-800 dark:text-white text-sm focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || coolOff || lockoutRemaining > 0}
            className="skeuo-button w-full text-blue-600 dark:text-blue-400 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : coolOff ? 'Please wait...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
            Create one
          </Link>
        </p>
        </div>
        </ScrollReveal>
      </div>
    </>
  )
}
