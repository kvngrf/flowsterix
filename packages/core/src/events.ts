export type EventMap = Record<string, unknown>

export type EventKey<TEventMap extends EventMap> = Extract<
  keyof TEventMap,
  string
>

export type EventHandler<
  TEventMap extends EventMap,
  TKey extends EventKey<TEventMap>,
> = (payload: TEventMap[TKey]) => void

export interface EventBus<TEventMap extends EventMap> {
  on: <TKey extends EventKey<TEventMap>>(
    event: TKey,
    handler: EventHandler<TEventMap, TKey>,
  ) => () => void
  once: <TKey extends EventKey<TEventMap>>(
    event: TKey,
    handler: EventHandler<TEventMap, TKey>,
  ) => () => void
  off: <TKey extends EventKey<TEventMap>>(
    event: TKey,
    handler: EventHandler<TEventMap, TKey>,
  ) => void
  emit: <TKey extends EventKey<TEventMap>>(
    event: TKey,
    payload: TEventMap[TKey],
  ) => void
  clear: () => void
}

export const createEventBus = <
  TEventMap extends EventMap,
>(): EventBus<TEventMap> => {
  const listeners = new Map<
    EventKey<TEventMap>,
    Set<(payload: unknown) => void>
  >()

  const on: EventBus<TEventMap>['on'] = (event, handler) => {
    const set = listeners.get(event) ?? new Set<(payload: unknown) => void>()
    set.add(handler as (payload: unknown) => void)
    listeners.set(event, set)
    return () => off(event, handler)
  }

  const once: EventBus<TEventMap>['once'] = (event, handler) => {
    const wrapper: EventHandler<TEventMap, typeof event> = (payload) => {
      off(event, wrapper)
      handler(payload)
    }
    return on(event, wrapper)
  }

  const off: EventBus<TEventMap>['off'] = (event, handler) => {
    const set = listeners.get(event)
    if (!set) return
    set.delete(handler as (payload: unknown) => void)
    if (set.size === 0) {
      listeners.delete(event)
    }
  }

  const emit: EventBus<TEventMap>['emit'] = (event, payload) => {
    const set = listeners.get(event)
    if (!set) return
    for (const handler of Array.from(set)) {
      ;(handler as EventHandler<TEventMap, typeof event>)(payload)
    }
  }

  const clear: EventBus<TEventMap>['clear'] = () => {
    listeners.clear()
  }

  return { on, once, off, emit, clear }
}
