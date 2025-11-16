import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { TourTokensOverride } from '@tour/react'
import type { TourThemePreset, TourThemePresetId } from '@tour/themes'
import { listTourThemePresets } from '@tour/themes'

export type TourThemeId = TourThemePresetId

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

const PRESET_METADATA: Array<TourThemePreset> = listTourThemePresets()

export const TOUR_THEME_OPTIONS: Array<TourThemeOption> = PRESET_METADATA.map(
  ({ id, label, description }): TourThemeOption => ({
    id,
    label,
    description,
  }),
)

const THEME_OVERRIDES: Record<TourThemeId, TourTokensOverride | undefined> =
  PRESET_METADATA.reduce<Record<TourThemeId, TourTokensOverride | undefined>>(
    (acc, preset) => {
      acc[preset.id] = preset.tokens
      return acc
    },
    {
      classic: undefined,
      aurora: undefined,
      nebula: undefined,
    },
  )

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
