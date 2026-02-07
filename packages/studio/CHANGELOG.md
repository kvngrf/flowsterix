# @flowsterix/studio

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
