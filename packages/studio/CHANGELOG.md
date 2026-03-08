# @flowsterix/studio

## 0.3.0

### Minor Changes

- Add `FlowIntegration` type and `integrations` prop to TourProvider for first-class plugin composition. Analytics handlers fan out to all integrations, storage adapters chain via `wrapStorage`, and `onVersionMismatch` callbacks fan out. User-provided `analytics`, `storageAdapter`, and `onVersionMismatch` props compose with integrations rather than overriding them. Add `studioIntegration()` factory to `@flowsterix/studio` so Studio can be wired without modifying the registry component.

### Patch Changes

- Updated dependencies
  - @flowsterix/core@0.11.0

## 0.1.0

### Minor Changes

- Initial release of Flowsterix Studio SDK
  - `createStudioBridge` factory for connecting tours to Studio backend
  - Analytics handlers for all 12 flow events (flowStart, stepEnter, flowError, etc.)
  - JSON-safe event serialization — strips functions, React nodes, converts RegExp
  - Batched HTTP transport with configurable batch size and flush interval
  - Retry on failure with 500-event buffer cap to prevent memory leaks
  - `sendBeacon` fallback on page unload for reliable delivery
  - `StorageAdapter` wrapper for syncing storage operations to Studio
  - `identify()` for attaching user context mid-session
  - `flush()` and `shutdown()` lifecycle methods
