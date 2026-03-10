'use client'

import {createContext, ReactNode, useContext} from 'react'

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
  return (
    <UserContext.Provider value={{user: initialUser}}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
