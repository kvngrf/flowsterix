# @flowsterix/studio

SDK bridge that connects [Flowsterix](https://flowsterix.com) to Flowsterix Studio. Intercepts analytics events and storage operations, serializes them to JSON-safe payloads, and ships them in batches to the Studio ingest endpoint.

## Installation

```bash
npm install @flowsterix/studio @flowsterix/core
```

## Quick Start

```ts
import { createStudioBridge } from '@flowsterix/studio'
import { createLocalStorageAdapter } from '@flowsterix/core'

const bridge = createStudioBridge({
  projectId: 'proj_abc',
  apiKey: 'sk_live_xxx',
  user: { id: 'user-123', traits: { plan: 'pro' } },
})
```

Then pass the bridge to your tour provider:

```tsx
<TourProvider
  flows={flows}
  analytics={bridge.analytics}
  storageAdapter={bridge.storage({ inner: createLocalStorageAdapter() })}
>
  {children}
</TourProvider>
```

## API

### `createStudioBridge(options)`

Creates a bridge instance that intercepts tour events and syncs them to Studio.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `projectId` | `string` | *required* | Your Studio project ID |
| `apiKey` | `string` | *required* | Studio API key |
| `endpoint` | `string` | `https://ingest.flowsterix.studio` | Ingest endpoint URL |
| `user` | `UserContext` | — | Initial user context (`{ id, traits? }`) |
| `debug` | `boolean` | `false` | Include stack traces in error events |
| `batchSize` | `number` | `20` | Events per batch before auto-flush |
| `flushIntervalMs` | `number` | `5000` | Flush interval in milliseconds |

#### Returns `StudioBridge`

| Property | Type | Description |
|---|---|---|
| `analytics` | `FlowAnalyticsHandlers` | Pass to `TourProvider`'s `analytics` prop |
| `storage` | `(params: { inner: StorageAdapter }) => StorageAdapter` | Wraps a storage adapter with Studio sync |
| `identify` | `(params: { user: UserContext }) => void` | Update user context mid-session |
| `flush` | `() => Promise<void>` | Force-flush buffered events |
| `shutdown` | `() => void` | Flush remaining events and clean up |

## How It Works

1. **Analytics handlers** — The bridge creates handlers for all 12 flow events (`flowStart`, `stepEnter`, etc.). Each handler serializes the event payload (stripping functions, React nodes, and converting RegExp to strings) and enqueues it for transport.

2. **Batched transport** — Events are buffered and sent in batches via `POST /v1/ingest`. On failure, events are re-queued for the next flush. The buffer is capped at 500 events to prevent memory leaks.

3. **Storage sync** — The storage wrapper delegates all reads/writes to your inner adapter (e.g. localStorage) and fire-and-forget enqueues `storage.set`/`storage.remove` events to Studio.

4. **Page unload** — On `visibilitychange` → `hidden`, remaining events are flushed via `navigator.sendBeacon` (with `fetch` + `keepalive` as fallback).

5. **Flow registration** — Flows aren't registered upfront. Every event includes a serialized flow manifest, and the backend deduplicates by `(projectId, flowId, version)`.

## Identifying Users

Call `identify()` after authentication to attach user context to all subsequent events:

```ts
bridge.identify({
  user: { id: userId, traits: { plan: 'pro', role: 'admin' } }
})
```

## Cleanup

Call `shutdown()` when your app unmounts to flush remaining events:

```ts
useEffect(() => {
  return () => bridge.shutdown()
}, [])
```

## License

MIT
