# Flowster MVP Plan

## Status Checklist

- [x] Week 1: Monorepo scaffolding, core engine, validation
- [ ] Week 2: DOM targeting and React binding
- [ ] Week 3: Animations, positioning, router adapters
- [ ] Week 4: Accessibility polish, examples, tests, release

## 1. MVP Scope (solve 80% of use cases)

- [ ] Target overlay highlights DOM element via selector/ref, auto-scrolls it into view, dims rest with mask
- [ ] Tooltip/popover supports arrow, title/body, primary/secondary actions
- [ ] Step system with ids, target, content, placement, mask options, advance rules
- [ ] Next/back/skip controls plus keyboard shortcuts (Enter/Space continue, Esc exit)
- [ ] Advance triggers for manual, click, change, route change, custom predicate
- [ ] Routing-aware steps that wait for route/element readiness and optional navigation
- [ ] Persistence via LocalStorage with namespaced key and schema version per flow
- [ ] Serializable flow state machine: idle → running → paused → completed/cancelled
- [ ] Framer Motion animations with swappable abstraction
- [ ] Accessibility: focus management, ARIA roles, reduce-motion, screen-reader text, tabbable controls
- [ ] Developer experience: typed API, Zod validation, helpful errors, dev overlay, default styles, theming via CSS vars

## 2. Architecture Overview (keep it portable)

- [x] `@tour/core` framework-agnostic engine (flows, transitions, advance rules)
- [ ] DOM anchoring utilities (query target, compute rect, observer hooks)
- [ ] Scroll manager
- [x] StorageAdapter interface with LocalStorage implementation
- [ ] RouterAdapter interface without runtime dependency
- [x] Event bus with analytics hooks
- [x] `@tour/react` bindings (Provider, hooks, components)
- [ ] AnimationAdapter using Framer Motion
- [ ] Router adapters (`@tour/react-router-adapter`, `@tour/next-adapter`)
- [ ] Optional packages (`@tour/themes`, example apps)

## 3. Core Types and DSL

- [x] Generic `Step<C>` definition (id, target, route, placement, mask, content, advance, waitFor, hooks)
- [x] AdvanceRule variants (manual, event, predicate, delay, route)
- [x] Serializable FlowState shape (status, stepIndex, version, updatedAt)
- [x] Keep core content generic so bindings render UI

## 4. React Binding API (DX-focused)

- [x] `createFlow` helper with strong typing
- [x] `<TourProvider>`, `useTour`, and `TourRenderer`
- [ ] Sample flow definition mirroring onboarding use case
- [ ] Optional declarative `<Flow>` / `<Step>` API behind feature flag or later roadmap

## 5. Routing and Multi-page Flows

- [ ] RouterAdapter interface (`onRouteChange`, `getPath`)
- [ ] React Router and Next.js adapters
- [ ] Step route gating with route + element readiness waiting
- [ ] `onEnter` hooks with optional navigation support
- [ ] `waitFor` handling for lazy-loaded content
- [ ] Persistence across reloads resumes next ready step

## 6. Persistence

- [x] StorageAdapter contract (`get`, `set`, `remove`, optional `subscribe`)
- [x] LocalStorage implementation with namespacing and schema versioning
- [x] MemoryStorage for testing and sample CustomStorageAdapter

## 7. Animations (smooth by default, swappable later)

- [ ] AnimationAdapter interface for enter/exit transitions and highlight morphs
- [ ] Framer Motion default implementation (overlay, panel, reposition transitions)
- [ ] Respect `prefers-reduced-motion` and expose duration tokens

## 8. Positioning and Overlay

- [ ] Floating UI integration (or initial math) for placement/collision handling
- [ ] Highlight mask using CSS clip-path hole with fallback
- [ ] Observe rect changes via ResizeObserver + requestAnimationFrame updates
- [ ] MutationObserver for mount/unmount handling
- [ ] Scroll listeners for scrollable containers and window

## 9. Accessibility and UX

- [ ] Focus trap within popover and focus return on close
- [ ] `aria-modal` dialog semantics with linked descriptions
- [ ] Keyboard support (Enter/Space next, Shift+Tab/Tab within trap, Esc exit)
- [ ] High-contrast theme, visible focus ring, screen-reader-only descriptions
- [ ] Option to ensure target is keyboard reachable (temporary tabindex)

## 10. Edge Cases to Handle Early

- [ ] Element-not-found timeout handling with configurable skip/failure
- [ ] Hidden/zero-size element fallback (auto-skip or screen modal)
- [ ] Scrolling container detection with offset handling for sticky headers
- [ ] Portal rendering to `document.body` to avoid z-index clashes; support custom container
- [ ] Mobile responsiveness with safe area placement
- [ ] Virtualized list support via wait/predicate or developer-provided hooks

## 11. Testing and Quality

- [ ] Unit tests (Vitest + jsdom) for engine, adapters, persistence
- [ ] Integration tests (Playwright) for DOM, routes, key flows
- [ ] Visual snapshots per theme and placement
- [ ] Type tests to lock public API surface
- [ ] Example apps (Vite + React Router, Next.js) for real-world validation

## 12. Packaging and Repo Layout

- [x] Monorepo via pnpm + Turborepo with workspace packages
- [x] `packages/core`, `packages/react` scaffolded (adapter/theme packages pending)
- [ ] `examples/react-vite`, `examples/next`
- [ ] Build tooling with tsup (ESM, CJS, d.ts) and `sideEffects:false` where safe
- [ ] Peer dependency declarations (react >=18, framer-motion, @floating-ui/react in React pkg)
- [ ] Linting/formatting (eslint, prettier), commitlint, changesets for semver management

## 13. Developer Experience Niceties

- [ ] Zod schemas plus invariant error codes with actionable tips
- [ ] Debug mode overlay for step diagnostics
- [ ] Theming tokens via CSS variables (spacing, radii, shadows)
- [ ] Analytics hooks (`onFlowStart`, `onStepEnter`, `onStepComplete`, `onFlowComplete`)

## 14. Roadmap After MVP

- [ ] Branching flows / conditional steps
- [ ] Backdrop interaction modes (block, passthrough)
- [ ] Multi-target steps and guided cursor
- [ ] Internationalization surface (message ids, binding render)
- [ ] Plugin ecosystem (analytics, external storage, tour builder)
- [ ] Shadow DOM and iframe support

## 15. Framework-agnostic Complexity Assessment

- [ ] Keep core free of React/Framer Motion dependencies for future bindings
- [ ] Use generics in core to defer rendering decisions
- [ ] Track effort split: Core 50–60%, React bindings 30–40%, adapters/docs 10–20%

## 16. Suggested Implementation Steps (4-week MVP)

- [x] Week 1: Monorepo setup, core engine, Zod validation
- [ ] Week 2: DOM targeting/observers, React binding (Provider, hooks, Overlay, Popover, controls)
- [ ] Week 3: Framer Motion animations, Floating UI positioning, mask overlay, router adapters, waitFor support
- [ ] Week 4: Accessibility/theming/debug mode/errors, examples, docs, tests, publish v0.1.0

## 17. Open Questions

- [ ] Decide on inclusion of declarative API (`<Flow><Step/>`) in v0
- [ ] Define minimum browser support and necessary polyfills
- [ ] Establish persistence policy across app versions (flow.version migrations)
- [ ] Determine default behavior for outside click (advance, dismiss, no-op)
