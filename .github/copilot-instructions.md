# Copilot Instructions for Flowsterix

## Architecture Overview

Flowsterix is an onboarding tour/flow library with a framework-agnostic core and React bindings. The monorepo uses **pnpm workspaces + Turborepo**.

### Package Structure

> **Note:** Packages currently use `@flowsterix/*` naming but will be renamed to `@flowsterix/*`.

- `@flowsterix/core` – Framework-agnostic state machine, flow definitions (Zod-validated), persistence, event bus. Zero React dependencies.
- `@flowsterix/react` – React bindings with `TourProvider`, hooks (`useTour`, `useTourTarget`, `useTourHud`), UI components, router adapters, and `motion/react` animation system.
- `@flowsterix/headless` – Re-exports `@flowsterix/react` minus UI components/CSS for custom HUD implementations. **Preferred entry point** for shadcn-style customization.
- `examples/react-vite` – Reference app using TanStack Router.

### Key Data Flow

1. Define flows via `createFlow()` with Zod validation
2. `TourProvider` holds flow registry and creates `FlowStore` on activation
3. `FlowStore` manages state machine transitions (`idle → running → completed`)
4. Hooks like `useTourTarget` compute geometry; `useTourHud` bundles all HUD behavior
5. Router adapters sync step gating with route changes

## Commands

```bash
pnpm install          # Install all workspace dependencies
pnpm dev              # Start Vite dev server (react-vite example)
pnpm build            # Build all packages (Turbo, respects dependency order)
pnpm test             # Run Vitest tests across packages
pnpm lint             # ESLint across packages
pnpm format:write     # Prettier format all files
```

## Conventions

### Flow Definitions

Define flows in `createFlow<ReactNode>()` with typed content. Steps use:

- `target`: `'screen'` or `{ selector, getNode?, description? }`
- `advance`: Array of rules like `{ type: 'manual' }`, `{ type: 'event', event: 'click' }`, `{ type: 'delay', delayMs }`, `{ type: 'route', path }`
- `waitFor`: Optional `{ selector?, predicate?, timeout? }` for lazy content

See [examples/react-vite/src/tour/flows.tsx](examples/react-vite/src/tour/flows.tsx) for patterns.

### Component Patterns

- HUD components live in `packages/react/src/components/`
- Hooks in `packages/react/src/hooks/` – prefer composing smaller hooks
- `useTourHud` is the all-in-one hook; lower-level hooks (`useHudState`, `useHudAppearance`, etc.) for granular control

### Styling

- UI lives in shadcn registry components synced into each app
- Customize with Tailwind or your own CSS variables
- Use `data-tour-*` attributes for custom styling hooks
- Tailwind classes in `@flowsterix/react` components use `tailwind-merge`

### Router Integration

Multiple adapters at `@flowsterix/react/router/*`:

- TanStack Router: `getTourRouter()` + `<TanStackRouterSync />`
- React Router: `useReactRouterTourAdapter()`
- Next.js App/Pages: dedicated adapters

Set router before provider mounts. Example in [examples/react-vite/src/tour/routerBridge.ts](examples/react-vite/src/tour/routerBridge.ts).

### Testing

- Vitest + jsdom for unit tests
- Test files: `__tests__/*.test.ts` alongside source
- Use `createFlowStore()` directly for core logic tests without React

### Adding New Hooks

1. Create in `packages/react/src/hooks/`
2. Export types and hook from `packages/react/src/index.tsx`
3. If headless-compatible, also export from `packages/react/src/headless.ts`

## Important Patterns

### Step Target Resolution

Targets resolve via selector or `getNode()`. Hidden/missing targets trigger `hiddenDelayMs` wait then `hidden` fallback mode (`'screen'` or `'skip'`).

### Advance Rules

Steps can have multiple advance rules (OR logic). Common patterns:

```tsx
advance: [{ type: 'manual' }] // Next button only
advance: [{ type: 'event', event: 'click', on: 'target' }] // Click target
advance: [{ type: 'delay', delayMs: 3000 }] // Auto-advance
advance: [{ type: 'manual' }, { type: 'delay', delayMs: 5000 }] // Either
```

### Headless Mode

Set `hud: { render: 'none' }` on flow, then build custom UI using `useTourHud()` or lower-level hooks. See [docs/guides/headless.md](docs/guides/headless.md).
