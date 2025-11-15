import { useCallback } from 'react'

import { useTourTheme } from '../tour/theme'

export interface TourThemeToggleProps {
  className?: string
}

export function TourThemeToggle({ className }: TourThemeToggleProps) {
  const { theme, setTheme, options } = useTourTheme()

  const handleSelect = useCallback(
    (nextTheme: typeof theme) => {
      setTheme(nextTheme)
    },
    [setTheme],
  )

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
              onClick={() => handleSelect(option.id)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' ' ||
                  event.key === 'Space'
                ) {
                  event.preventDefault()
                  handleSelect(option.id)
                }
              }}
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
