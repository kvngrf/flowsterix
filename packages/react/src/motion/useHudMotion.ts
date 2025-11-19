import type { Transition } from 'motion/react'
import { useMemo } from 'react'

import type { AnimationAdapterComponents } from './animationAdapter'
import { useAnimationAdapter } from './animationAdapter'

const DEFAULT_HIGHLIGHT_TRANSITION: Transition = {
  duration: 0.35,
  ease: 'easeOut',
  type: 'spring',
  damping: 25,
  stiffness: 300,
  mass: 0.7,
}

const DEFAULT_OVERLAY_TRANSITION: Transition = {
  duration: 0.35,
  ease: 'easeOut',
}

const DEFAULT_POPOVER_ENTRANCE_TRANSITION: Transition = {
  duration: 0.25,
  ease: 'easeOut',
}

const DEFAULT_POPOVER_EXIT_TRANSITION: Transition = {
  duration: 0.2,
  ease: 'easeOut',
}

const DEFAULT_POPOVER_CONTENT_TRANSITION: Transition = {
  duration: 0.6,
  ease: 'easeOut',
}

export interface UseHudMotionResult {
  components: AnimationAdapterComponents
  transitions: {
    highlight: Transition
    overlayFade: Transition
    popoverEntrance: Transition
    popoverExit: Transition
    popoverContent: Transition
  }
}

export const useHudMotion = (): UseHudMotionResult => {
  const adapter = useAnimationAdapter()

  return useMemo(() => {
    const components: AnimationAdapterComponents = {
      ...adapter.components,
    }

    return {
      components,
      transitions: {
        highlight:
          adapter.transitions.overlayHighlight ?? DEFAULT_HIGHLIGHT_TRANSITION,
        overlayFade:
          adapter.transitions.overlayFade ?? DEFAULT_OVERLAY_TRANSITION,
        popoverEntrance:
          adapter.transitions.popoverEntrance ??
          DEFAULT_POPOVER_ENTRANCE_TRANSITION,
        popoverExit:
          adapter.transitions.popoverExit ?? DEFAULT_POPOVER_EXIT_TRANSITION,
        popoverContent:
          adapter.transitions.popoverContent ??
          DEFAULT_POPOVER_CONTENT_TRANSITION,
      },
    }
  }, [adapter])
}
