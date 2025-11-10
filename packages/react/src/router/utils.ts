const ensurePrefix = (value: string, prefix: string) =>
  value.startsWith(prefix) ? value : `${prefix}${value}`

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const toSearchString = (value: unknown): string => {
  if (!isNonEmptyString(value)) {
    if (value instanceof URLSearchParams) {
      const serialized = value.toString()
      return serialized.length > 0 ? `?${serialized}` : ''
    }
    if (typeof value === 'object' && value !== null) {
      try {
        const params = new URLSearchParams()
        for (const [key, raw] of Object.entries(
          value as Record<string, unknown>,
        )) {
          if (raw === undefined || raw === null) continue
          params.set(key, String(raw))
        }
        const serialized = params.toString()
        return serialized.length > 0 ? `?${serialized}` : ''
      } catch {
        return ''
      }
    }
    return ''
  }

  if (value === '?') return ''
  return value.startsWith('?') ? value : ensurePrefix(value, '?')
}

const toHashString = (value: unknown): string => {
  if (!isNonEmptyString(value)) {
    return ''
  }
  if (value === '#') return ''
  return value.startsWith('#') ? value : ensurePrefix(value, '#')
}

export const createPathString = (
  pathname: unknown,
  search?: unknown,
  hash?: unknown,
): string => {
  const normalizedPath = isNonEmptyString(pathname)
    ? pathname.startsWith('/')
      ? pathname
      : `/${pathname}`
    : '/'
  const searchPart = toSearchString(search)
  const hashPart = toHashString(hash)
  return `${normalizedPath}${searchPart}${hashPart}`
}
