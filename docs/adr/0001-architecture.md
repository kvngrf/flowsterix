# ADR 0001: Tour Library Architecture

## Status

Accepted – 2025-11-04

## Context

We want an onboarding tour system that can ship an ergonomic React MVP while preserving a clear path to other frameworks. To do that we need a separation between a framework-agnostic core (state machine, persistence, analytics) and the UI bindings that render overlays, popovers, and animations. We also need developer tooling (monorepo, shared configs) that scales to additional packages without duplicating setup.

## Decision

- Use a pnpm + Turborepo monorepo with `packages/*` for publishable libraries and `examples/*` for runnable sandboxes.
- Implement `@flowsterix/core` as a React-free engine that provides:
  - Typed flow definitions (`createFlow`) validated via Zod.
  - A serialisable finite-state machine with persistence hooks and an event bus.
  - Storage and router adapter interfaces for platform-specific integrations.
- Implement `@flowsterix/react` as the first binding layer, wiring React context/hooks to the core engine while deferring UI rendering to future components.
- Keep example applications (starting with Vite + React Router) in `examples/` so real-world usage can evolve without leaking app-specific concerns into publishable packages.

## Consequences

- We can iterate on core logic independent from React UI, keeping future bindings (Vue, Svelte) viable.
- Testing, linting, and build tooling are centralised, avoiding drift between packages.
- The React binding will evolve overlays/animations in place without polluting the core package surface.
- Developers can dogfood features quickly via the example app while still shipping a clean library API.
