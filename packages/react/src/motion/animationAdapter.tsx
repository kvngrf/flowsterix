import type { Transition } from 'motion/react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface AnimationAdapterComponents {
  MotionDiv: typeof motion.div
  MotionSvg: typeof motion.svg
  MotionDefs: typeof motion.defs
  MotionMask: typeof motion.mask
  MotionRect: typeof motion.rect
}

export interface AnimationAdapterTransitions {
  overlayHighlight?: Transition
  overlayFade?: Transition
  popoverEntrance?: Transition
  popoverExit?: Transition
  popoverContent?: Transition
  delayIndicator?: Transition
}

export interface AnimationAdapter {
  components: AnimationAdapterComponents
  transitions: AnimationAdapterTransitions
}

const defaultAdapter: AnimationAdapter = {
  components: {
    MotionDiv: motion.div,
    MotionSvg: motion.svg,
    MotionDefs: motion.defs,
    MotionMask: motion.mask,
    MotionRect: motion.rect,
  },
  transitions: {
    overlayHighlight: {
      duration: 0.35,
      ease: 'easeOut',
      type: 'spring',
      damping: 25,
      stiffness: 300,
      mass: 0.7,
    },
    overlayFade: {
      duration: 0.35,
      ease: 'easeOut',
    },
    popoverEntrance: {
      duration: 0.25,
      ease: 'easeOut',
    },
    popoverExit: {
      duration: 0.2,
      ease: 'easeOut',
    },
    popoverContent: {
      duration: 0.6,
      ease: 'easeOut',
    },
    delayIndicator: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
}

const AnimationAdapterContext = createContext<AnimationAdapter>(defaultAdapter)

export interface AnimationAdapterProviderProps {
  adapter?: AnimationAdapter
  children: ReactNode
}

export const AnimationAdapterProvider = ({
  adapter,
  children,
}: AnimationAdapterProviderProps) => {
  const value = useMemo(() => adapter ?? defaultAdapter, [adapter])
  return (
    <AnimationAdapterContext.Provider value={value}>
      {children}
    </AnimationAdapterContext.Provider>
  )
}

export const useAnimationAdapter = (): AnimationAdapter => {
  return useContext(AnimationAdapterContext)
}

export const defaultAnimationAdapter = defaultAdapter

export const reducedMotionAnimationAdapter: AnimationAdapter = {
  components: defaultAdapter.components,
  transitions: {
    overlayHighlight: {
      duration: 0.001,
      ease: 'linear',
      type: 'tween',
    },
    overlayFade: {
      duration: 0.001,
      ease: 'linear',
    },
    popoverEntrance: {
      duration: 0.001,
      ease: 'linear',
    },
    popoverExit: {
      duration: 0.001,
      ease: 'linear',
    },
    popoverContent: {
      duration: 0.001,
      ease: 'linear',
    },
    delayIndicator: {
      duration: 0.001,
      ease: 'linear',
    },
  },
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export interface UseAnimationAdapterOptions {
  defaultAdapter?: AnimationAdapter
  reducedMotionAdapter?: AnimationAdapter
  enabled?: boolean
}

export const usePreferredAnimationAdapter = (
  options?: UseAnimationAdapterOptions,
): AnimationAdapter => {
  const {
    defaultAdapter: defaultOption = defaultAnimationAdapter,
    reducedMotionAdapter: reducedOption = reducedMotionAnimationAdapter,
    enabled = true,
  } = options ?? {}

  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (!enabled || typeof window === 'undefined') return false
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches)
    }

    setPrefersReduced(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enabled])

  if (!enabled) {
    return defaultOption
  }

  return prefersReduced ? reducedOption : defaultOption
}
