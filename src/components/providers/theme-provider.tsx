'use client'

import {ThemeProvider as NextThemesProvider} from 'next-themes'
import * as React from 'react'

type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: 'class' | 'data-theme'
  defaultTheme?: string
  enableSystem?: boolean
  themes?: string[]
  storageKey?: string
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = true,
  themes = ['light', 'dark', 'system'],
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      themes={themes}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
