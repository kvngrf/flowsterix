# Flowsterix MVP Plan

## Status Checklist

- [x] Week 1: Monorepo scaffolding, core engine, validation
- [x] Week 2: DOM targeting and React binding
- [x] Week 3: Animations, positioning, router adapters
- [ ] Week 4: Examples, QA, docs, release

## 1. MVP Scope (solve 80% of use cases)

- [x] Target overlay highlights DOM element via selector/ref, auto-scrolls it into view, dims rest with mask
- [x] Tooltip/popover supports arrow, title/body, primary/secondary actions
- [x] Step system with ids, target, content, placement, mask options, advance rules
- [x] Next/back/skip controls plus keyboard shortcuts (Enter/Space continue, Esc exit)
- [x] Advance triggers for manual, click, change, route change, custom predicate
- [x] Routing-aware steps that wait for route/element readiness and optional navigation
- [x] Persistence via LocalStorage with namespaced key and schema version per flow
- [x] Serializable flow state machine: idle → running → paused → completed/cancelled
- [x] Framer Motion animations with swappable abstraction
- [x] Accessibility: focus management, ARIA roles, reduce-motion, screen-reader text, tabbable controls
- [x] Developer experience foundations: typed API, Zod validation, helpful errors, dev overlay, default styles

## 2. Architecture Overview (keep it portable)

- [x] `@flowsterix/core` framework-agnostic engine (flows, transitions, advance rules)
- [x] DOM anchoring utilities (query target, compute rect, observer hooks)
- [x] Scroll manager
- [x] StorageAdapter interface with LocalStorage implementation
- [x] RouterAdapter interface without runtime dependency
- [x] Event bus with analytics hooks
- [x] `@flowsterix/react` bindings (Provider, hooks, headless utilities)
- [x] AnimationAdapter using Framer Motion
- [x] Router adapters (React Router, Next App/Pages, TanStack) exported via `@flowsterix/react`
- [x] Optional packages (example apps)

## 3. Core Types and DSL

- [x] Generic `Step<C>` definition (id, target, route, placement, mask, content, advance, waitFor, hooks)
- [x] AdvanceRule variants (manual, event, predicate, delay, route)
- [x] Serializable FlowState shape (status, stepIndex, version, updatedAt)
- [x] Keep core content generic so bindings render UI

## 4. React Binding API (DX-focused)

- [x] `createFlow` helper with strong typing
- [x] `<TourProvider>`, `useTour`, and headless hooks (UI lives in shadcn registry)
- [x] Sample flow definition mirroring onboarding use case
- [ ] Optional declarative `<Flow>` / `<Step>` API behind feature flag or later roadmap

## 5. Routing and Multi-page Flows

- [x] RouterAdapter interface (`onRouteChange`, `getPath`)
- [x] React Router and Next.js adapters
- [x] Step route gating with route + element readiness waiting
- [x] `onEnter` hooks with optional navigation support
- [x] `waitFor` handling for lazy-loaded content
- [x] Persistence across reloads resumes next ready step

## 6. Persistence

- [x] StorageAdapter contract (`get`, `set`, `remove`, optional `subscribe`)
- [x] LocalStorage implementation with namespacing and schema versioning
- [x] MemoryStorage for testing and sample CustomStorageAdapter

## 7. Animations (smooth by default, swappable later)

- [x] AnimationAdapter interface for enter/exit transitions and highlight morphs
- [x] Framer Motion default implementation (overlay, panel, reposition transitions)
- [x] Respect `prefers-reduced-motion` and expose duration tokens

## 8. Positioning and Overlay

- [x] Floating UI integration (or initial math) for placement/collision handling
- [x] Highlight mask using CSS clip-path hole with fallback
- [x] Observe rect changes via ResizeObserver + requestAnimationFrame updates
- [x] MutationObserver for mount/unmount handling
- [x] Scroll listeners for scrollable containers and window

## 9. Accessibility and UX

- [x] Focus trap within popover and focus return on close
- [x] `aria-modal` dialog semantics with linked descriptions
- [x] Keyboard support (Enter/Space next, Shift+Tab/Tab within trap, Esc exit)
- [x] Visible focus ring, screen-reader-only descriptions
- [x] Option to ensure target is keyboard reachable (temporary tabindex)

## 10. Edge Cases to Handle Early

- [x] Element-not-found timeout handling with configurable skip/failure
- [x] Hidden/zero-size element fallback (auto-skip or screen modal)
- [x] Scrolling container detection with offset handling for sticky headers
- [x] Portal rendering to `document.body` to avoid z-index clashes; support custom container
- [x] Mobile responsiveness with safe area placement
- [x] Virtualized list support via wait/predicate or developer-provided hooks

## 11. Testing and Quality

- [x] Vitest setup with initial core/react unit tests
- [ ] Expand unit tests for engine, adapters, and persistence (beyond core events + React hooks/components)
- [ ] Integration tests (Playwright) for DOM, routes, key flows
- [ ] Visual snapshots per placement
- [ ] Type tests to lock public API surface
- [x] Example app: Vite + TanStack Router (`examples/react-vite`)
- [x] Example apps: React Router + Next.js for real-world validation

## 12. Packaging and Repo Layout

- [x] Monorepo via pnpm + Turborepo with workspace packages
- [x] `packages/core`, `packages/react`, `packages/shadcn-registry` scaffolded
- [x] `examples/react-vite`
- [x] `examples/shadcn-demo`
- [x] `examples/next`
- [x] Build tooling with tsup (ESM, CJS, d.ts) in core/react
- [ ] Add `sideEffects` flags where safe
- [x] Peer dependency declarations for react/react-dom + router/next in `@flowsterix/react`
- [ ] Decide peer/dependency policy for Motion and Floating UI
- [x] Linting/formatting (eslint, prettier)
- [ ] Commitlint + changesets for semver management

## 13. Developer Experience Niceties

- [x] Zod schemas plus invariant error codes with actionable tips
- [x] Debug mode overlay for step diagnostics
- [x] UI styling handled in shadcn components
- [x] Analytics hooks (`onFlowStart`, `onStepEnter`, `onStepComplete`, `onFlowComplete`)

## 14. Roadmap After MVP

- [ ] Branching flows / conditional steps
- [x] Backdrop interaction modes (block, passthrough)
- [ ] Multi-target steps and guided cursor
- [x] Internationalization surface (labels prop on TourProvider, useTourLabels hook)
- [ ] Plugin ecosystem (analytics, external storage, tour builder)
- [ ] Shadow DOM and iframe support

## 15. Framework-agnostic Complexity Assessment

- [ ] Keep core free of React/Framer Motion dependencies for future bindings
- [ ] Use generics in core to defer rendering decisions
- [ ] Track effort split: Core 50–60%, React bindings 30–40%, adapters/docs 10–20%

## 16. Suggested Implementation Steps (4-week MVP)

- [x] Week 1: Monorepo setup, core engine, Zod validation
- [x] Week 2: DOM targeting/observers, React binding (Provider, hooks, Overlay, Popover, controls)
- [x] Week 3: Framer Motion animations, Floating UI positioning, mask overlay, router adapters, waitFor support
- [ ] Week 4: Examples, docs, tests, publish v0.1.0

## 17. Open Questions

- [ ] Decide on inclusion of declarative API (`<Flow><Step/>`) in v0
- [ ] Define minimum browser support and necessary polyfills
- [ ] Establish persistence policy across app versions (flow.version migrations)
- [ ] Determine default behavior for outside click (advance, dismiss, no-op)
