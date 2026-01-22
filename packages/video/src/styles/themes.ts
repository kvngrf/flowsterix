// Shadcn-style theme based on the shadcn-demo
export const SHADCN = {
  name: 'Shadcn',
  // Dark mode colors
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: {
    background: '#171717',
    foreground: '#fafafa',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  popover: {
    background: '#171717',
    foreground: '#fafafa',
    radius: '0.75rem',
    shadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    primary: {
      bg: '#fafafa',
      color: '#171717',
      border: 'transparent',
    },
    secondary: {
      bg: 'rgba(255, 255, 255, 0.1)',
      color: '#fafafa',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  overlay: {
    background: 'rgba(0, 0, 0, 0.5)',
    ringShadow: '0 0 0 2px #fafafa, 0 0 20px rgba(250, 250, 250, 0.3)',
    blur: 6,
    radius: 12,
  },
  muted: '#a1a1aa',
  accent: '#fafafa',
  accentGlow: 'rgba(250, 250, 250, 0.3)',
  destructive: '#ef4444',
  success: '#22c55e',
  border: 'rgba(255, 255, 255, 0.1)',
}

// Keep old themes for reference but make SHADCN the default
export const AURORA = {
  name: 'Aurora',
  background: '#030712',
  foreground: '#f8fafc',
  card: {
    background: '#1e293b',
    foreground: '#f8fafc',
    border: 'rgba(148, 163, 184, 0.1)',
  },
  popover: {
    background: 'rgba(8, 18, 35, 0.94)',
    foreground: '#e8f9ff',
    radius: '1.5rem',
    shadow: '0 50px 90px -35px rgba(35, 188, 255, 0.5)',
    border: 'rgba(56, 189, 248, 0.45)',
  },
  button: {
    primary: {
      bg: '#38bdf8',
      color: '#04101d',
      border: 'rgba(34, 211, 238, 0.6)',
    },
    secondary: {
      bg: 'rgba(34, 197, 94, 0.12)',
      color: '#7fffd4',
      border: 'rgba(56, 189, 248, 0.35)',
    },
  },
  overlay: {
    background: 'rgba(5, 18, 35, 0.82)',
    ringShadow:
      'inset 0 0 0 2px rgba(34, 211, 238, 0.6), inset 0 0 0 8px rgba(56, 189, 248, 0.35)',
    blur: 8,
    radius: 28,
  },
  muted: '#94a3b8',
  accent: '#38bdf8',
  accentGlow: 'rgba(35, 188, 255, 0.5)',
  destructive: '#ef4444',
  success: '#22c55e',
  border: 'rgba(148, 163, 184, 0.1)',
}

export type Theme = typeof SHADCN
export const themes = { shadcn: SHADCN, aurora: AURORA }
export const DEFAULT_THEME = SHADCN
