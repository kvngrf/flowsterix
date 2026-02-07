import type { StudioEvent, Transport } from './types'

const MAX_BUFFER_SIZE = 500

interface CreateTransportParams {
  endpoint: string
  apiKey: string
  batchSize: number
  flushIntervalMs: number
}

export const createTransport = (params: CreateTransportParams): Transport => {
  const { endpoint, apiKey, batchSize, flushIntervalMs } = params
  const url = `${endpoint.replace(/\/$/, '')}/v1/ingest`
  let buffer: StudioEvent[] = []
  let flushing = false

  const timer = setInterval(() => {
    void flush()
  }, flushIntervalMs)

  const flush = async (): Promise<void> => {
    if (buffer.length === 0 || flushing) return
    flushing = true

    const batch = buffer.splice(0, batchSize)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: batch }),
      })
      if (!res.ok) {
        console.warn(`[studio] ingest failed: ${res.status} ${res.statusText}`)
        requeue(batch)
      }
    } catch (err) {
      console.warn('[studio] ingest error:', err)
      requeue(batch)
    } finally {
      flushing = false
    }
  }

  const requeue = (events: StudioEvent[]) => {
    buffer = [...events, ...buffer].slice(0, MAX_BUFFER_SIZE)
  }

  const enqueue = (event: StudioEvent) => {
    if (buffer.length >= MAX_BUFFER_SIZE) {
      buffer.shift()
    }
    buffer.push(event)
    if (buffer.length >= batchSize) {
      void flush()
    }
  }

  const shutdown = () => {
    clearInterval(timer)
    if (buffer.length === 0) return

    const payload = JSON.stringify({ events: buffer })
    buffer = []

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const sent = navigator.sendBeacon(
        url,
        new Blob([payload], { type: 'application/json' }),
      )
      if (sent) return
    }

    // Fallback: fire-and-forget fetch with keepalive
    void fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Best-effort, nothing we can do
    })
  }

  return { enqueue, flush, shutdown }
}
