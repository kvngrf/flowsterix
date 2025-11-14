import { useEffect, useMemo, useState } from 'react'

type ThemeId = 'default' | 'aurora'

const STORAGE_KEY = 'flowster-demo-tour-theme'

const THEME_OPTIONS: Array<{
  id: ThemeId
  label: string
  description: string
}> = [
  {
    id: 'default',
    label: 'Classic',
    description: 'Uses the library default tokens',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    description: 'Applies the vivid example overrides',
  },
]

const isBrowser = typeof window !== 'undefined'

const readStoredTheme = (): ThemeId => {
  if (!isBrowser) return 'default'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'aurora' ? 'aurora' : 'default'
  } catch {
    return 'default'
  }
}

const applyTheme = (theme: ThemeId) => {
  if (!isBrowser) return
  const body = window.document.body
  if (theme === 'default') {
    body.removeAttribute('data-tour-theme')
  } else {
    body.setAttribute('data-tour-theme', theme)
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can throw in private browsing; ignore errors.
  }
}

export interface TourThemeToggleProps {
  className?: string
}

export function TourThemeToggle({ className }: TourThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeId>(() => readStoredTheme())
  const options = useMemo(() => THEME_OPTIONS, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div
      className={
        className
          ? `flex items-center gap-2 ${className}`
          : 'flex items-center gap-2'
      }
      data-tour-target="theme-toggle"
    >
      <span className="hidden md:inline text-sm font-medium text-slate-200">
        Tour theme
      </span>
      <div className="inline-flex rounded-full bg-slate-700/70 p-1 shadow-inner">
        {options.map((option) => {
          const isActive = option.id === theme
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={`relative px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-full ${isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white hover:bg-slate-600/80'}`}
              aria-pressed={isActive}
              title={option.description}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
