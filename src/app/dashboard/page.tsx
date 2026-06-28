import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButton'
import TransitionLink from '@/components/ui/TransitionLink'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { PlusCircle, LogIn, Folder, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 skeuo-box p-6">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                Welcome, <span className="text-blue-500 dark:text-blue-400">{profile?.name}</span>
              </h1>
              <div className="skeuo-inset px-4 py-2 mt-3 inline-block">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="skeuo-button rounded-full">
                <ThemeToggle />
              </div>
              <div className="skeuo-button rounded-xl">
                <LogoutButton />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <ScrollReveal delay={0.2}>
            <TransitionLink href="/dashboard/create-room" className="skeuo-button p-8 block text-center h-full">
              <div className="skeuo-inset w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-4">
                <PlusCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">Create Room</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Start a new file sharing room</p>
            </TransitionLink>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <TransitionLink href="/dashboard/join-room" className="skeuo-button p-8 block text-center h-full">
              <div className="skeuo-inset w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-4">
                <LogIn className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">Join Room</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Enter a room with its name and password</p>
            </TransitionLink>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <TransitionLink href="/dashboard/my-rooms" className="skeuo-button p-8 block text-center h-full">
              <div className="skeuo-inset w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-4">
                <Folder className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">My Rooms</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Rooms you have created</p>
            </TransitionLink>
          </ScrollReveal>

          <ScrollReveal delay={0.5}>
            <TransitionLink href="/dashboard/history" className="skeuo-button p-8 block text-center h-full">
              <div className="skeuo-inset w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-4">
                <Clock className="w-10 h-10 text-purple-500" />
              </div>
              <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">History</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Rooms you have previously visited</p>
            </TransitionLink>
          </ScrollReveal>
        </div>

      </div>
    </div>
  )
}