'use client'
import {createContext, useContext, useState} from 'react'

export const OnboardContext = createContext<{
  onboardings: Map<string, string | React.ReactNode>
  setOnboardings: React.Dispatch<
    React.SetStateAction<Map<string, string | React.ReactNode>>
  >
  addOnboarding: (props: {
    id: string
    content: string | React.ReactNode
  }) => void
  removeOnboarding: (props: {id: string}) => void
}>({
  onboardings: new Map(),
  setOnboardings: () => {},
  addOnboarding: () => {},
  removeOnboarding: () => {},
})

export function OnboardProvider({children}: {children: React.ReactNode}) {
  const [onboardings, setOnboardings] = useState(new Map())

  interface AddOnboardingProps {
    id: string
    content: string | React.ReactNode
  }
  const addOnboarding = ({id, content}: AddOnboardingProps) => {
    setOnboardings(prev => {
      const newMap = new Map(prev)
      newMap.set(id, content)
      return newMap
    })
  }

  interface RemoveOnboardingProps {
    id: string
  }
  const removeOnboarding = ({id}: RemoveOnboardingProps) => {
    setOnboardings(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  return (
    <OnboardContext.Provider
      value={{
        onboardings,
        setOnboardings,
        addOnboarding,
        removeOnboarding,
      }}
    >
      {children}
    </OnboardContext.Provider>
  )
}

export const useOnboard = () => {
  const context = useContext(OnboardContext)
  if (context === undefined) {
    throw new Error('useOnboard must be used within a OnboardProvider')
  }
  return context
}
