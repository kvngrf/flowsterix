'use client'

import type { CSSProperties } from 'react'
import type { DevToolsTab } from '../types'

const styles = {
  container: {
    display: 'flex',
    gap: 2,
    padding: '8px 10px 0',
    borderBottom: '1px solid hsl(215 20% 20%)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'hsl(215 20% 55%)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    marginBottom: -1,
  },
  tabActive: {
    color: 'hsl(217 91% 70%)',
    borderBottomColor: 'hsl(217 91% 60%)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    backgroundColor: 'hsl(215 20% 22%)',
    color: 'hsl(215 20% 60%)',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 9,
  },
  badgeActive: {
    backgroundColor: 'hsl(217 91% 55% / 0.2)',
    color: 'hsl(217 91% 70%)',
  },
} as const

export interface TabNavProps {
  activeTab: DevToolsTab
  onTabChange: (tab: DevToolsTab) => void
  stepCount: number
  flowCount: number
}

export function TabNav(props: TabNavProps) {
  const { activeTab, onTabChange, stepCount, flowCount } = props

  const stepsTabStyle: CSSProperties = {
    ...styles.tab,
    ...(activeTab === 'steps' && styles.tabActive),
  }

  const flowsTabStyle: CSSProperties = {
    ...styles.tab,
    ...(activeTab === 'flows' && styles.tabActive),
  }

  const stepsBadgeStyle: CSSProperties = {
    ...styles.badge,
    ...(activeTab === 'steps' && styles.badgeActive),
  }

  const flowsBadgeStyle: CSSProperties = {
    ...styles.badge,
    ...(activeTab === 'flows' && styles.badgeActive),
  }

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={stepsTabStyle}
        onClick={() => onTabChange('steps')}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12zM5.904 10.803L10 6.707v2.768a.5.5 0 0 0 1 0V5.5a.5.5 0 0 0-.5-.5H6.525a.5.5 0 1 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 .707.707z" />
        </svg>
        Steps
        {stepCount > 0 && <span style={stepsBadgeStyle}>{stepCount}</span>}
      </button>
      <button
        type="button"
        style={flowsTabStyle}
        onClick={() => onTabChange('flows')}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0V8h-5v.5a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 2 7h5.5V6A1.5 1.5 0 0 1 6 4.5v-1zm-3 8A1.5 1.5 0 0 1 4.5 10h1A1.5 1.5 0 0 1 7 11.5v1A1.5 1.5 0 0 1 5.5 14h-1A1.5 1.5 0 0 1 3 12.5v-1zm6 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 9 12.5v-1z" />
        </svg>
        Flows
        {flowCount > 0 && <span style={flowsBadgeStyle}>{flowCount}</span>}
      </button>
    </div>
  )
}
