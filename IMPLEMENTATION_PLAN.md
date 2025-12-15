# Flowsterix Professional Package Implementation Plan

## Package Status Overview

### ✅ What's Working Well

| Package                | Status         | Notes                                                                     |
| ---------------------- | -------------- | ------------------------------------------------------------------------- |
| `@flowsterix/core`     | **Solid**      | Zod validation, state machine, persistence, event bus, analytics hooks    |
| `@flowsterix/react`    | **Functional** | Full HUD, 16 hooks, 9 components, 4 router adapters, theming via CSS vars |
| `@flowsterix/headless` | **Basic**      | Re-exports from `@flowsterix/react` minus styled components               |
| `@flowsterix/themes`   | **Functional** | 3 presets (classic, aurora, nebula), token override system                |
| `examples/react-vite`  | **Working**    | TanStack Router demo with theme toggle                                    |

> **Note:** Packages have been renamed from `@tour/*` to `@flowsterix/*`.

### ⚠️ Gaps vs Original PLAN.md

| Category            | Original Plan                                                   | Current State                                         |
| ------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| **Testing**         | Unit tests (Vitest), Integration (Playwright), Visual snapshots | Only ~7 test files total, no Playwright, no snapshots |
| **Changesets**      | Versioning automation                                           | ❌ Not implemented                                    |
| **Next.js Example** | `examples/next`                                                 | ❌ Missing                                            |
| **Declarative API** | `<Flow>` / `<Step>` components                                  | ❌ Not started                                        |
| **Type Tests**      | Lock public API surface                                         | ❌ Not implemented                                    |
| **i18n**            | Message IDs, binding render                                     | ❌ Not started                                        |
| **Publishing**      | Peer deps, sideEffects, changesets                              | ❌ Packages still private                             |

### 🔍 Current Customization Analysis

**CSS Variables Approach:**

- ✅ 60+ CSS variables for comprehensive styling
- ✅ `data-tour-*` attributes for selector hooks
- ✅ Token system with `mergeTokens()` and per-flow overrides
- ⚠️ Component structure is fixed (can't change markup)
- ⚠️ Animation behavior locked to motion/react
- ⚠️ No slot pattern for injecting custom elements

**Headless Package Limitations:**

- Currently just re-exports hooks + primitives
- Still requires users to wire everything manually
- No example components to copy-paste
- High barrier to entry for custom implementations

---

## New Implementation Plan

### Phase 1: Headless-First Primitives (Priority: HIGH)

**Goal:** Make `@flowsterix/headless` the recommended entry point with composable primitives.

#### 1.1 Restructure Hook Composition

```
packages/react/src/primitives/
├── useTourState.ts        # Core state without UI concerns
├── useTourNavigation.ts   # next/back/skip/goToStep
├── useTourTarget.ts       # Target resolution + geometry (existing)
├── useTourOverlay.ts      # Overlay geometry computation (existing)
├── useTourKeyboard.ts     # Keyboard shortcuts (extract from useHudShortcuts)
├── useTourFocus.ts        # Focus management (extract from TourFocusManager)
├── useTourScroll.ts       # Scroll-into-view behavior
└── useTourAnnounce.ts     # Screen reader announcements
```

- [ ] Extract keyboard logic into standalone `useTourKeyboard` hook
- [ ] Extract focus trap into `useTourFocus` hook
- [ ] Create `useTourScroll` for scroll behavior control
- [ ] Add `useTourAnnounce` for ARIA live region management
- [ ] Update `@flowsterix/headless` exports with new primitives

#### 1.2 Render Props / Slot Pattern for Components

- [ ] Add `slots` prop to `TourHUD` for injecting custom elements:
  ```tsx
  <TourHUD
    slots={{
      overlay: CustomOverlay,
      popover: CustomPopover,
      controls: CustomControls,
      progressBar: CustomProgress,
    }}
  />
  ```
- [ ] Create `TourSlot` context for nested component communication
- [ ] Document slot API in headless guide

#### 1.3 Unstyled Component Variants

- [ ] Create `@flowsterix/react/unstyled` export path with zero-CSS components
- [ ] Each unstyled component accepts `className` + `asChild` (Radix pattern)
- [ ] Components: `Overlay`, `Popover`, `Controls`, `ProgressBar`, `StepCounter`

---

### Phase 2: Shadcn Registry Distribution (Priority: HIGH)

**Goal:** Enable `npx shadcn add flowsterix/tour-popover` for copy-paste components.

#### 2.1 Registry Setup

```
packages/shadcn-registry/
├── registry.json           # Component manifest
├── components/
│   ├── tour-provider.tsx   # Minimal provider setup
│   ├── tour-overlay.tsx    # Styled overlay with Tailwind
│   ├── tour-popover.tsx    # Styled popover card
│   ├── tour-controls.tsx   # Back/Next/Skip buttons
│   ├── tour-progress.tsx   # Step progress indicator
│   ├── tour-spotlight.tsx  # Alternative highlight style
│   └── tour-tooltip.tsx    # Simpler tooltip variant
├── hooks/
│   └── use-tour.tsx        # Re-export with comments
└── blocks/
    ├── onboarding-flow.tsx # Complete onboarding example
    └── feature-tour.tsx    # Feature discovery example
```

- [ ] Create `packages/shadcn-registry` with proper structure
- [ ] Define `registry.json` schema following shadcn conventions
- [ ] Build 6-8 copy-paste components using Tailwind + @flowsterix/headless
- [ ] Create 2-3 "blocks" (complete flow examples)
- [ ] Add CLI publishing workflow to shadcn registry
- [ ] Document installation: `npx shadcn@latest add https://flowsterix.dev/r/tour-popover`

#### 2.2 Component Design System

Each shadcn component should:

- [ ] Use `@flowsterix/headless` hooks only (no `@flowsterix/react` components)
- [ ] Use `motion/react` for animations (consistent with core package)
- [ ] Include Tailwind classes with `cn()` utility
- [ ] Support `className` override prop
- [ ] Include inline JSDoc comments explaining customization
- [ ] Work standalone or composed together

#### 2.3 Variants & Themes

- [ ] Each component supports `variant` prop: `default`, `minimal`, `glass`, `solid`
- [ ] Create matching Tailwind preset in `@flowsterix/themes`
- [ ] Add dark mode support via `dark:` variants

---

### Phase 3: Testing & Quality (Priority: MEDIUM)

#### 3.1 Unit Test Coverage

Target: 80%+ coverage for core logic

- [ ] `@flowsterix/core`: State machine transitions, persistence, validation
- [ ] `@flowsterix/react/hooks`: All 16 hooks with edge cases
- [ ] `@flowsterix/react/primitives`: New extracted primitives

#### 3.2 Integration Tests (Playwright)

- [ ] Setup Playwright in `tests/e2e/`
- [ ] Test flows: start → navigate → complete
- [ ] Test keyboard navigation
- [ ] Test mobile responsive behavior
- [ ] Test router integration (TanStack, React Router)

#### 3.3 Visual Regression

- [ ] Setup Chromatic or Percy
- [ ] Snapshot each theme preset
- [ ] Snapshot each placement option
- [ ] Snapshot mobile layout

#### 3.4 Type Tests

- [ ] Add `tsd` or `expect-type` for API surface locking
- [ ] Test generic type inference in `createFlow<T>()`
- [ ] Test hook return types

---

### Phase 4: Developer Experience (Priority: MEDIUM)

#### 4.1 Documentation Site

- [ ] Setup Astro/Starlight docs site in `apps/docs/`
- [ ] API reference auto-generated from TSDoc
- [ ] Interactive examples with StackBlitz embeds
- [ ] Migration guide from other tour libraries

#### 4.2 CLI Tool

```bash
npx @flowsterix/cli init          # Setup provider + first flow
npx @flowsterix/cli add flow      # Scaffold new flow file
npx @flowsterix/cli add component # Add shadcn component
```

- [ ] Create `packages/cli` with commander.js
- [ ] `init` command: detects framework, adds dependencies, creates files
- [ ] `add` command: scaffolds flows or components
- [ ] Framework detection: Vite, Next.js, Remix

#### 4.3 DevTools Extension

- [ ] Browser extension for flow debugging
- [ ] Visual step editor
- [ ] Export flow definitions

---

### Phase 5: Release Infrastructure (Priority: MEDIUM)

#### 5.1 Changesets

- [ ] Add `@changesets/cli` to root
- [ ] Configure `changeset.config.json`
- [ ] Add GitHub Action for release workflow
- [ ] Document contribution workflow

#### 5.2 Package Publishing

- [ ] Remove `"private": true` from publishable packages
- [ ] Configure `publishConfig` for npm
- [ ] Add `sideEffects: false` where applicable
- [ ] Verify peer dependency declarations

#### 5.3 CI/CD Pipeline

- [ ] GitHub Actions: lint, test, build on PR
- [ ] Automated npm publish on release tag
- [ ] Bundle size tracking with size-limit
- [ ] Automated changelog generation

---

### Phase 6: Examples & Templates (Priority: LOW)

#### 6.1 Next.js Example

- [ ] Create `examples/next-app-router/`
- [ ] Demonstrate App Router adapter
- [ ] Show server component boundaries

#### 6.2 Starter Templates

- [ ] `create-tour-app` CLI or degit templates
- [ ] Vite + React template
- [ ] Next.js template
- [ ] Remix template

---

## Recommended Execution Order

| Week | Focus           | Deliverables                           |
| ---- | --------------- | -------------------------------------- |
| 1-2  | Phase 2.1-2.2   | Shadcn registry MVP with 4 components  |
| 3    | Phase 1.1-1.2   | Restructured hooks + slots API         |
| 4    | Phase 3.1       | Core + hooks unit tests (80% coverage) |
| 5    | Phase 5.1-5.2   | Changesets + first npm publish         |
| 6    | Phase 2.3 + 4.1 | Component variants + docs site MVP     |
| 7-8  | Phase 3.2-3.3   | Playwright + visual regression         |
| 9+   | Phase 4.2, 6.x  | CLI, templates, polish                 |

---

## Why Shadcn Registry?

| Benefit                  | Impact                                      |
| ------------------------ | ------------------------------------------- |
| **Copy-paste ownership** | Users own the code, can modify anything     |
| **Tailwind-native**      | Matches modern React ecosystem expectations |
| **Low barrier**          | `npx shadcn add` is familiar to many devs   |
| **Incremental adoption** | Add one component at a time                 |
| **Versioning freedom**   | Users upgrade when ready, not forced        |
| **SEO/Discovery**        | Listed in shadcn ecosystem                  |

The CSS variables approach remains valuable for users who want the default HUD with minor tweaks. Shadcn serves users who want full control from day one.

---

## Decisions Made

| Question         | Decision                                                         | Rationale                                    |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Package naming   | **`@flowsterix/*`**                                              | Rebrand from `@tour/*` for stronger identity |
| Shadcn registry  | **Self-host**                                                    | Faster iteration, full control               |
| Animations       | **motion/react**                                                 | Proven, great DX, acceptable bundle size     |
| First components | `tour-popover`, `tour-controls`, `tour-overlay`, `tour-progress` | Core building blocks                         |

## Open Questions

1. **Minimum React version:** Stay at React 18 or require 19 for `use()`?
2. **Monorepo tool:** Stay with Turborepo or evaluate Nx for better caching?

---

## Success Metrics

- [ ] Time to first working tour: < 5 minutes
- [ ] Shadcn component install: < 30 seconds
- [ ] Bundle size (core + headless): < 15KB gzipped
- [ ] Test coverage: > 80%
- [ ] npm weekly downloads: 1K+ within 3 months of launch
