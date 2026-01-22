# Storage Adapters

Flowsterix persists tour state (current step, completion status, etc.) through a `StorageAdapter` interface. This enables resuming tours after page reloads and tracking completion across sessions.

## Built-in Adapters

### LocalStorage (default)

```tsx
import { TourProvider } from '@flowsterix/react'

// Uses localStorage by default - no configuration needed
<TourProvider flows={flows}>
```

To customize the storage namespace:

```tsx
<TourProvider flows={flows} storageNamespace="my-app">
```

Keys are stored as `{namespace}:{flowId}` (e.g., `my-app:onboarding`).

### Memory Storage

For testing or ephemeral state:

```tsx
import { MemoryStorageAdapter } from '@flowsterix/core'

const storageAdapter = new MemoryStorageAdapter()

<TourProvider flows={flows} storageAdapter={storageAdapter}>
```

## Server-Side Persistence

For per-user persistence (storing tour state in your database), use `createApiStorageAdapter` or implement a custom adapter.

### API Storage Adapter

The `createApiStorageAdapter` utility creates an adapter that persists state via HTTP:

```tsx
import { createApiStorageAdapter } from '@flowsterix/core'
import { TourProvider } from '@flowsterix/react'

const storageAdapter = createApiStorageAdapter({
  baseUrl: '/api/tour-state',
  getHeaders: () => ({
    Authorization: `Bearer ${getAuthToken()}`,
  }),
})

<TourProvider flows={flows} storageAdapter={storageAdapter}>
```

#### Expected API Contract

The adapter expects your API to implement:

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| `GET` | `/{key}` | - | `StorageSnapshot` JSON or 404 |
| `PUT` | `/{key}` | `StorageSnapshot` JSON body | 200/204 |
| `DELETE` | `/{key}` | - | 200/204 (404 is ok) |

#### StorageSnapshot Shape

```typescript
interface StorageSnapshot {
  version: number    // Flow version for migration detection
  value: FlowState   // The actual tour state
  updatedAt: number  // Unix timestamp
}
```

### Example: Next.js API Route

Here's a minimal Next.js API route using a database.

> **Note:** The `key` includes the flow ID (e.g., `tour:onboarding`), so each user can have multiple active flows stored as separate records.

```typescript
// app/api/tour-state/[key]/route.ts
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const record = await db.tourState.findUnique({
    where: {
      userId_key: { userId: session.user.id, key: params.key },
    },
  })

  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    version: record.version,
    value: record.state,
    updatedAt: record.updatedAt.getTime(),
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const snapshot = await request.json()

  await db.tourState.upsert({
    where: {
      userId_key: { userId: session.user.id, key: params.key },
    },
    create: {
      userId: session.user.id,
      key: params.key,
      version: snapshot.version,
      state: snapshot.value,
      updatedAt: new Date(snapshot.updatedAt),
    },
    update: {
      version: snapshot.version,
      state: snapshot.value,
      updatedAt: new Date(snapshot.updatedAt),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.tourState.deleteMany({
    where: {
      userId: session.user.id,
      key: params.key,
    },
  })

  return NextResponse.json({ ok: true })
}
```

### Example: Prisma Schema

```prisma
model TourState {
  id        String   @id @default(cuid())
  userId    String
  key       String   // e.g., "tour:onboarding"
  version   Int
  state     Json     // FlowState
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@index([userId])
}
```

## Custom Adapters

Implement the `StorageAdapter` interface for full control:

```typescript
import type { StorageAdapter, StorageSnapshot } from '@flowsterix/core'

const customAdapter: StorageAdapter = {
  async get(key: string): Promise<StorageSnapshot | null> {
    // Fetch from your storage
  },

  async set(key: string, snapshot: StorageSnapshot): Promise<void> {
    // Persist to your storage
  },

  async remove(key: string): Promise<void> {
    // Delete from your storage
  },

  // Optional: Enable reactivity when storage changes externally
  subscribe(listener: () => void): () => void {
    // Subscribe to changes, return unsubscribe function
    return () => {}
  },
}
```

## Hybrid Approach

Combine localStorage for immediate feedback with server sync:

```typescript
import {
  createApiStorageAdapter,
  createLocalStorageAdapter,
  type StorageAdapter,
  type StorageSnapshot,
} from '@flowsterix/core'

function createHybridAdapter(options: {
  baseUrl: string
  getHeaders: () => HeadersInit
}): StorageAdapter {
  const local = createLocalStorageAdapter()
  const api = createApiStorageAdapter(options)

  return {
    async get(key) {
      // Try local first for fast load
      const localSnapshot = local.get(key)

      // Fetch from server in background
      api.get(key).then((serverSnapshot) => {
        if (serverSnapshot && serverSnapshot.updatedAt > (localSnapshot?.updatedAt ?? 0)) {
          local.set(key, serverSnapshot)
        }
      })

      return localSnapshot
    },

    async set(key, snapshot) {
      // Write to both
      local.set(key, snapshot)
      await api.set(key, snapshot)
    },

    async remove(key) {
      local.remove(key)
      await api.remove(key)
    },
  }
}
```

## Disabling Persistence

To run tours without any persistence:

```tsx
import { MemoryStorageAdapter } from '@flowsterix/core'

<TourProvider
  flows={flows}
  storageAdapter={new MemoryStorageAdapter()}
  persistOnChange={false}
>
```
