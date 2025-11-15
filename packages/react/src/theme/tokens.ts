import { isBrowser } from '../utils/dom'

const TOKEN_PREFIX = '--tour'

type TokenPrimitive = string | number

type TokenBranch = {
  [key: string]: TokenPrimitive | TokenBranch
}

const isTokenBranch = (value: unknown): value is TokenBranch =>
  typeof value === 'object' && value !== null

type TokenPrimitiveOverride<TValue> = TValue extends number ? number : string

type DeepPartialBranch<TToken> = {
  [K in keyof TToken]?: TToken[K] extends TokenPrimitive
    ? TokenPrimitiveOverride<TToken[K]>
    : TToken[K] extends Record<string, unknown>
      ? DeepPartialBranch<TToken[K]>
      : TToken[K]
}

const defaultTokens = {
  font: {
    family:
      "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  },
  popover: {
    background: '#ffffff',
    foreground: '#0f172a',
    radius: '0.75rem',
    shadow: '0 20px 45px -20px rgba(15, 23, 42, 0.35)',
    border: {
      width: '0px',
      color: 'transparent',
    },
    padding: {
      block: '1.25rem',
      inline: '1.5rem',
    },
    lineHeight: '1.6',
    gap: '1rem',
  },
  controls: {
    marginBlockStart: '1.5rem',
    gap: '0.75rem',
    buttonGap: '0.5rem',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: '600',
    radius: '0.625rem',
    padding: {
      block: '0.5rem',
      inline: '1rem',
    },
    transition:
      'color 150ms ease, background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
    primary: {
      bg: 'rgb(15 23 42)',
      color: '#ffffff',
      border: 'rgb(15 23 42)',
      hoverBg: 'rgb(30 41 59)',
      disabledBg: 'rgb(15 23 42)',
      disabledOpacity: '0.6',
    },
    secondary: {
      bg: 'transparent',
      color: 'rgb(15 23 42)',
      border: 'rgb(226 232 240)',
      hoverBg: 'rgb(248 250 252)',
      hoverBorder: 'rgb(203 213 225)',
      disabledOpacity: '0.4',
    },
  },
  focus: {
    ringWidth: '2px',
    ringOffset: '2px',
    ringColor: 'rgb(6 182 212)',
    ringOffsetColor: '#ffffff',
  },
  overlay: {
    background: 'rgba(15, 23, 42, 0.6)',
    ringShadow:
      'inset 0 0 0 2px rgba(56, 189, 248, 0.4), inset 0 0 0 8px rgba(15, 23, 42, 0.3)',
    blur: '0px',
    radius: '12px',
  },
  shadow: {
    hud: {
      panel: '0 24px 50px -25px rgba(15, 23, 42, 0.65)',
    },
  },
} as const satisfies TokenBranch

export type TourTokens = typeof defaultTokens
export type TourTokensOverride = DeepPartialBranch<TourTokens>

type TokenPaths<
  TToken,
  TPrefix extends string = '',
> = TToken extends TokenPrimitive
  ? TPrefix
  : {
      [K in keyof TToken]: K extends string
        ? TokenPaths<TToken[K], TPrefix extends '' ? K : `${TPrefix}.${K}`>
        : never
    }[keyof TToken]

export type TourTokenPath = Exclude<TokenPaths<TourTokens>, ''>

const kebabCase = (value: string) =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-')

const toCssVarName = (pathSegments: Array<string>) =>
  `${TOKEN_PREFIX}-${pathSegments.map(kebabCase).join('-')}`

const collectTokenPaths = (
  branch: TokenBranch,
  currentPath: Array<string> = [],
  output: Array<string> = [],
) => {
  for (const [key, value] of Object.entries(branch)) {
    const nextPath = [...currentPath, key]
    if (isTokenBranch(value)) {
      collectTokenPaths(value, nextPath, output)
    } else {
      output.push(nextPath.join('.'))
    }
  }
  return output
}

const flattenTokens = (
  branch: TokenBranch,
  currentPath: Array<string> = [],
  output: Record<string, string> = {},
) => {
  for (const [key, value] of Object.entries(branch)) {
    const nextPath = [...currentPath, key]
    if (isTokenBranch(value)) {
      flattenTokens(value, nextPath, output)
    } else {
      const cssVarName = toCssVarName(nextPath)
      output[cssVarName] = String(value)
    }
  }
  return output
}

const DEFAULT_TOKEN_PATHS = collectTokenPaths(defaultTokens)
const TOKEN_PATH_SET = new Set(DEFAULT_TOKEN_PATHS)

export const isTourTokenPath = (value: string): value is TourTokenPath =>
  TOKEN_PATH_SET.has(value)

export const tokenPathToCssVar = (path: TourTokenPath | string) =>
  toCssVarName(path.split('.'))

export const cssVar = (path: TourTokenPath | string, fallback?: string) =>
  fallback
    ? `var(${tokenPathToCssVar(path)}, ${fallback})`
    : `var(${tokenPathToCssVar(path)})`

const mergeBranches = (
  base: TokenBranch,
  overrides?: DeepPartialBranch<TokenBranch>,
): TokenBranch => {
  if (!overrides) {
    return base
  }

  const result: TokenBranch = { ...base }

  for (const key of Object.keys(overrides) as Array<keyof typeof overrides>) {
    const overrideValue = overrides[key]
    if (overrideValue === undefined) continue
    const baseValue = base[key]

    if (isTokenBranch(baseValue) && isTokenBranch(overrideValue)) {
      result[key] = mergeBranches(baseValue, overrideValue)
    } else {
      result[key] = overrideValue
    }
  }

  return result
}

export const mergeTokens = (
  base: TourTokens,
  overrides?: TourTokensOverride,
): TourTokens => {
  if (!overrides) {
    return base
  }
  return mergeBranches(
    base as TokenBranch,
    overrides as TokenBranch,
  ) as TourTokens
}

export const applyTokensToDocument = (
  tokens: TourTokens,
  target?: HTMLElement | null,
) => {
  if (!isBrowser) return () => {}
  const element = target ?? document.documentElement
  const flattened = flattenTokens(tokens as TokenBranch)
  const previousValues = new Map<string, string>()

  for (const [cssVarName, value] of Object.entries(flattened)) {
    previousValues.set(cssVarName, element.style.getPropertyValue(cssVarName))
    element.style.setProperty(cssVarName, value)
  }

  return () => {
    for (const [cssVarName, previousValue] of previousValues.entries()) {
      if (previousValue) {
        element.style.setProperty(cssVarName, previousValue)
      } else {
        element.style.removeProperty(cssVarName)
      }
    }
  }
}

export { defaultTokens }
