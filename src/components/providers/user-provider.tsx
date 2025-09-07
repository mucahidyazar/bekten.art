'use client'

import {createContext, ReactNode, useContext, useEffect, useState} from 'react'

import {createClient} from '@/utils/supabase/client'
import {EnhancedUser} from '@/utils/supabase/server'

interface UserContextType {
  user: EnhancedUser | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
  initialUser?: EnhancedUser | null
}

export function UserProvider({
  children,
  initialUser = null,
}: UserProviderProps) {
  const [user, setUser] = useState<EnhancedUser | null>(initialUser)

  useEffect(() => {
    const supabase = createClient()

    // Auth state değişikliklerini dinle - sadece sign out için
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      // Sign in durumunda sayfa yenilenir zaten, server-side getUser çalışır
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <UserContext.Provider value={{user}}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
