import { createClient } from '../supabase/client'

export async function registerUser(name: string, email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })

  if (error) throw error
  return data
}

export async function loginUser(email: string, password: string) {
  const supabase = createClient()

  // 1. Check rate limit
  const { data: limitData } = await supabase.rpc('check_login_rate_limit', { target_email: email })
  if (limitData && limitData.blocked) {
    throw new Error(`Too many failed attempts. Try again in ${Math.ceil(limitData.remaining_mins)} minutes.`)
  }

  // 2. Attempt login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  // 3. Record attempt (whether success or failure)
  await supabase.rpc('record_login_attempt', { target_email: email, is_success: !error })

  if (error) throw new Error('Incorrect email or password')
  return data
}

export async function logoutUser() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}