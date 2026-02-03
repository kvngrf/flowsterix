'use client'

import { useEffect, useState } from 'react'
import type { Transition } from 'motion/react'

// Spring configs for different animation feels
export const springs = {
  snappy: {
    type: 'spring',
    damping: 30,
    stiffness: 500,
    mass: 0.5,
  } as Transition,
  smooth: {
    type: 'spring',
    damping: 30,
    stiffness: 300,
    mass: 0.8,
  } as Transition,
  bouncy: {
    type: 'spring',
    damping: 15,
    stiffness: 400,
    mass: 0.5,
  } as Transition,
}

// Tween presets with custom easing
export const tweens = {
  fast: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  } as Transition,
  default: {
    duration: 0.2,
    ease: [0.16, 1, 0.3, 1],
  } as Transition,
}

// Stagger configurations for list animations
export const stagger = {
  fast: {
    staggerChildren: 0.03,
    delayChildren: 0.05,
  },
  default: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },
}

// List item variants for staggered entrance/exit
export const listItemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

// Container variants for staggered children
export const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: stagger.fast,
  },
}

// Shake animation for error states (returns keyframes for x)
export const shakeKeyframes = {
  x: [0, -8, 8, -6, 6, -4, 4, 0],
  transition: { duration: 0.4, ease: 'easeOut' },
}

// Hook to detect reduced motion preference
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

// Get transition based on reduced motion preference
export function getTransition(params: {
  transition: Transition
  reducedMotion: boolean
}): Transition {
  const { transition, reducedMotion } = params
  if (reducedMotion) {
    return { duration: 0 }
  }
  return transition
}
