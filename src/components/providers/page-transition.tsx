'use client'

import {usePathname} from 'next/navigation'

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion'
import {ReactNode} from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({children}: PageTransitionProps) {
  const pathname = usePathname()
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={false}
        animate={{opacity: 1, y: 0}}
        exit={shouldReduceMotion ? {opacity: 1, y: 0} : {opacity: 0, y: -10}}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.3,
          ease: 'easeInOut',
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
