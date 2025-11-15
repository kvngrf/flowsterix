import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { TourTokensOverride } from '@tour/react'

export type TourThemeId = 'classic' | 'aurora' | 'nebula'

export interface TourThemeOption {
  id: TourThemeId
  label: string
  description: string
}

interface TourThemeContextValue {
  theme: TourThemeId
  setTheme: (theme: TourThemeId) => void
  options: Array<TourThemeOption>
  tokensOverride?: TourTokensOverride
}

const STORAGE_KEY = 'flowster-demo-tour-theme'
const isBrowser = typeof window !== 'undefined'

export const TOUR_THEME_OPTIONS: Array<TourThemeOption> = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Uses the library default tokens',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    description: 'Vibrant cyan + aqua glow',
  },
  {
    id: 'nebula',
    label: 'Nebula',
    description: 'Deep purple highlights with neon accents',
  },
]

const THEME_OVERRIDES: Record<TourThemeId, TourTokensOverride | undefined> = {
  classic: undefined,
  aurora: {
    font: {
      family:
        "'Space Grotesk', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    },
    popover: {
      background: 'rgba(8, 18, 35, 0.94)',
      foreground: '#e8f9ff',
      radius: '1.5rem',
      shadow: '0 50px 90px -35px rgba(35, 188, 255, 0.5)',
      border: {
        width: '1px',
        color: 'rgba(56, 189, 248, 0.45)',
      },
      padding: {
        block: '1rem',
        inline: '1.2rem',
      },
      lineHeight: '1.7',
      gap: '1.4rem',
    },
    controls: {
      marginBlockStart: '2rem',
      gap: '1rem',
      buttonGap: '0.75rem',
    },
    button: {
      fontSize: '0.9rem',
      fontWeight: '600',
      radius: '9999px',
      padding: {
        block: '0.65rem',
        inline: '1.4rem',
      },
      transition:
        'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, color 180ms ease, transform 220ms ease',
      primary: {
        bg: '#38bdf8',
        color: '#04101d',
        border: 'rgba(34, 211, 238, 0.6)',
        hoverBg: '#22d3ee',
        disabledBg: 'rgba(56, 189, 248, 0.55)',
        disabledOpacity: '0.75',
      },
      secondary: {
        bg: 'rgba(34, 197, 94, 0.12)',
        color: '#7fffd4',
        border: 'rgba(56, 189, 248, 0.35)',
        hoverBg: 'rgba(56, 189, 248, 0.22)',
        hoverBorder: 'rgba(34, 197, 94, 0.45)',
        disabledOpacity: '0.6',
      },
    },
    focus: {
      ringWidth: '2px',
      ringOffset: '3px',
      ringColor: 'rgba(7, 221, 254, 0.9)',
      ringOffsetColor: 'rgba(8, 18, 35, 0.95)',
    },
    overlay: {
      background: 'rgba(5, 18, 35, 0.82)',
      ringShadow:
        'inset 0 0 0 2px rgba(34, 211, 238, 0.6), inset 0 0 0 8px rgba(56, 189, 248, 0.35)',
      blur: '8px',
      radius: '1.75rem',
    },
    shadow: {
      hud: {
        panel: '0 50px 90px -35px rgba(5, 18, 35, 0.8)',
      },
    },
  },
  nebula: {
    font: {
      family:
        "'General Sans', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
    },
    popover: {
      background: 'rgba(13, 8, 23, 0.94)',
      foreground: '#f5e9ff',
      radius: '0',
      shadow: '0 55px 110px -45px rgba(156, 81, 255, 0.55)',
      border: {
        width: '1px',
        color: 'rgba(216, 180, 254, 0.45)',
      },
      padding: {
        block: '1.15rem',
        inline: '1.35rem',
      },
      lineHeight: '1.65',
      gap: '1.2rem',
    },
    controls: {
      marginBlockStart: '1.8rem',
      gap: '0.9rem',
      buttonGap: '0.65rem',
    },
    button: {
      fontSize: '0.92rem',
      fontWeight: '600',
      radius: '0',
      padding: {
        block: '0.6rem',
        inline: '1.25rem',
      },
      transition:
        'background-color 180ms ease, border-color 180ms ease, box-shadow 200ms ease, color 180ms ease',
      primary: {
        bg: '#7c3aed',
        color: '#fdf4ff',
        border: 'rgba(236, 72, 153, 0.5)',
        hoverBg: '#a855f7',
        disabledBg: 'rgba(124, 58, 237, 0.5)',
        disabledOpacity: '0.7',
      },
      secondary: {
        bg: 'rgba(56, 189, 248, 0.08)',
        color: '#f0abfc',
        border: 'rgba(168, 85, 247, 0.4)',
        hoverBg: 'rgba(168, 85, 247, 0.18)',
        hoverBorder: 'rgba(236, 72, 153, 0.5)',
        disabledOpacity: '0.65',
      },
    },
    focus: {
      ringWidth: '2px',
      ringOffset: '3px',
      ringColor: 'rgba(244, 114, 182, 0.85)',
      ringOffsetColor: 'rgba(12, 4, 20, 0.95)',
    },
    overlay: {
      background: 'rgba(7, 3, 15, 0.82)',
      ringShadow:
        'inset 0 0 0 2px rgba(244, 114, 182, 0.65), inset 0 0 0 8px rgba(147, 51, 234, 0.3)',
      blur: '10px',
      radius: '0px',
    },
    shadow: {
      hud: {
        panel: '0 60px 120px -45px rgba(44, 8, 66, 0.8)',
      },
    },
  },
}

const TourThemeContext = createContext<TourThemeContextValue | undefined>(
  undefined,
)

const readStoredTheme = (): TourThemeId => {
  if (!isBrowser) return 'classic'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'aurora') return 'aurora'
    if (stored === 'nebula') return 'nebula'
    if (stored === 'classic' || stored === 'default') return 'classic'
    return 'classic'
  } catch {
    return 'classic'
  }
}

const persistTheme = (theme: TourThemeId) => {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can fail (for example in private browsing); ignore.
  }
}

const applyBodyAttribute = (theme: TourThemeId) => {
  if (!isBrowser) return
  const body = window.document.body
  if (theme === 'classic') {
    body.removeAttribute('data-tour-theme')
  } else {
    body.setAttribute('data-tour-theme', theme)
  }
}

export const TourThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setTheme] = useState<TourThemeId>(() => readStoredTheme())

  useEffect(() => {
    applyBodyAttribute(theme)
    persistTheme(theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      options: TOUR_THEME_OPTIONS,
      tokensOverride: THEME_OVERRIDES[theme],
    }),
    [theme],
  )

  return (
    <TourThemeContext.Provider value={value}>
      {children}
    </TourThemeContext.Provider>
  )
}

export const useTourTheme = () => {
  const context = useContext(TourThemeContext)
  if (!context) {
    throw new Error('useTourTheme must be used within a TourThemeProvider')
  }
  return context
}
