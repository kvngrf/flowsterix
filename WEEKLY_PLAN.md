# Flowster MVP Weekly Plan

## Week 1 – Core Foundations

- [x] Confirm MVP scope alignment and capture open decisions
- [x] Scaffold pnpm + Turborepo monorepo structure with core/react packages
- [x] Configure shared tooling (tsconfig base, eslint, prettier)
- [ ] Add changesets for versioning automation
- [x] Implement core flow engine state machine and type definitions (Step, FlowState, AdvanceRule)
- [x] Add Zod validation layer with helpful invariant errors
- [x] Create StorageAdapter contract with LocalStorage + Memory implementations
- [x] Stand up event bus hooks and analytics contract stubs
- [x] Draft architectural ADRs covering portability goals and content generics

## Week 2 – Targeting & React Binding

- [x] Build DOM anchoring utilities (querying, rect computation, observers)
- [x] Implement scroll manager for auto-scroll behavior
- [x] Create React provider, hooks (`useTour`), and initial context wiring
- [x] Ship basic Overlay, Popover, and Controls components with minimal styles
- [x] Wire next/back/skip flows and keyboard shortcuts
- [x] Integrate state machine with React layer for flow progression
- [x] Add dev/debug overlay toggle for step inspection
- [x] Smoke-test via Vite sandbox app showing a two-step flow

## Week 3 – Motion, Positioning, Routing

- [ ] Introduce AnimationAdapter interface and Framer Motion default implementation
- [ ] Integrate Floating UI (or interim positioning math) for Popover placement
- [ ] Implement highlight mask with clip-path hole and fallback strategy
- [ ] Add router adapters for React Router and Next.js with route gating
- [ ] Support `waitFor` logic for async elements with timeout handling
- [ ] Harden observers for resize/mutation/scroll edge cases
- [ ] Ensure persistence resumes correct step across navigations and reloads
- [ ] Document integration patterns for routing and async content

## Week 4 – Polish, QA, Release Prep

- [ ] Deliver accessibility polish (focus trap, aria semantics, reduced motion)
- [ ] Finalize theming via CSS variables and token documentation
- [ ] Expand analytics hooks (`onFlowStart`, `onStepEnter`, etc.) and error surface
- [ ] Implement robust edge-case handling (missing elements, hidden targets, mobile layout)
- [ ] Author comprehensive unit tests (Vitest) and begin Playwright scenarios
- [ ] Capture visual regression snapshots for key placements/themes
- [ ] Create example apps (React Vite, Next.js) and usage docs
- [ ] Prepare release checklist, versioning via Changesets, and publish v0.1.0
