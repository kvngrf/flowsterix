import { isBrowser } from '../utils/dom'

export type RouteChangeListener = (path: string) => void

const DEFAULT_POLL_MS = 150

const normalizePathname = (pathname: string | null | undefined) => {
  if (typeof pathname !== 'string' || pathname.length === 0) {
    return '/'
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

const normalizePrefixedSegment = (
  value: string | null | undefined,
  prefix: '?' | '#',
) => {
  if (typeof value !== 'string' || value.length === 0) {
    return ''
  }
  return value.startsWith(prefix) ? value : `${prefix}${value}`
}

const getWindowPath = () => {
  if (!isBrowser) return '/'
  const { pathname, search, hash } = window.location
  return (
    normalizePathname(pathname) +
    normalizePrefixedSegment(search, '?') +
    normalizePrefixedSegment(hash, '#')
  )
}

const normalizeExternalPath = (path: string) => {
  if (path.length === 0) {
    return '/'
  }

  try {
    const parsed = new URL(path, 'http://flowsterix.local')
    return (
      normalizePathname(parsed.pathname) +
      normalizePrefixedSegment(parsed.search, '?') +
      normalizePrefixedSegment(parsed.hash, '#')
    )
  } catch {
    const [withoutHash, hash = ''] = path.split('#')
    const [base, search = ''] = withoutHash.split('?')
    return (
      normalizePathname(base) +
      normalizePrefixedSegment(search ? `?${search}` : '', '?') +
      normalizePrefixedSegment(hash ? `#${hash}` : '', '#')
    )
  }
}

class RouteGatingChannel {
  #listeners = new Set<RouteChangeListener>()
  #currentPath: string = getWindowPath()
  #teardown: (() => void) | null = null

  #attachDefaultListeners() {
    if (!isBrowser) return
    if (this.#teardown) return

    let lastPath = getWindowPath()
    const emitIfChanged = () => {
      const nextPath = getWindowPath()
      if (nextPath === lastPath) return
      lastPath = nextPath
      this.notify(nextPath)
    }

    const handler = () => emitIfChanged()

    window.addEventListener('popstate', handler)
    window.addEventListener('hashchange', handler)

    const pollId = window.setInterval(emitIfChanged, DEFAULT_POLL_MS)

    this.#teardown = () => {
      window.removeEventListener('popstate', handler)
      window.removeEventListener('hashchange', handler)
      window.clearInterval(pollId)
      this.#teardown = null
    }
  }

  #detachDefaultListeners() {
    if (this.#listeners.size > 0) return
    this.#teardown?.()
    this.#teardown = null
  }

  getCurrentPath(): string {
    if (isBrowser) {
      this.#currentPath = getWindowPath()
    }
    return this.#currentPath
  }

  notify(path?: string) {
    const resolved =
      typeof path === 'string' && path.length > 0
        ? normalizeExternalPath(path)
        : this.getCurrentPath()
    if (resolved === this.#currentPath) {
      this.#currentPath = resolved
      return
    }
    this.#currentPath = resolved
    for (const listener of Array.from(this.#listeners)) {
      try {
        listener(resolved)
      } catch (error) {
        console.warn('[tour][route-gating] listener error', error)
      }
    }
  }

  subscribe(listener: RouteChangeListener) {
    if (this.#listeners.has(listener)) {
      return () => {
        this.#listeners.delete(listener)
        this.#detachDefaultListeners()
      }
    }

    this.#listeners.add(listener)
    if (this.#listeners.size === 1) {
      this.#attachDefaultListeners()
    }

    const current = this.getCurrentPath()
    try {
      listener(current)
    } catch (error) {
      console.warn('[tour][route-gating] listener error', error)
    }

    return () => {
      this.#listeners.delete(listener)
      this.#detachDefaultListeners()
    }
  }
}

export const routeGatingChannel = new RouteGatingChannel()

export const getCurrentRoutePath = () => routeGatingChannel.getCurrentPath()

export const notifyRouteChange = (path?: string) => {
  routeGatingChannel.notify(path)
}

export const subscribeToRouteChanges = (listener: RouteChangeListener) => {
  return routeGatingChannel.subscribe(listener)
}
