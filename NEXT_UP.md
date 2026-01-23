# Next Up (Prioritized)

1. Testing and QA coverage
   - ~~Expand unit tests for core engine, adapters, and persistence.~~ ✓ Done (EventBus, validation, storage adapters)
   - ~~Add Playwright smoke tests for DOM targeting, routing, and flows.~~ ✓ Done (lifecycle, persistence, UI tests)
   - ~~Add visual snapshot coverage for placements.~~ Skipped (relying on E2E + manual QA)

2. Example apps and docs
   - ~~Build `examples/next`~~ ✓ Done
   - ~~Add a React Router example~~ ✓ Done (`examples/react-router-vite`)
   - ~~Document setup for adapters and storage~~ ✓ Done (`docs/guides/storage-adapters.md`)

3. Release readiness
   - ~~Add Changesets + commitlint and a release checklist.~~ ✓ Done (Changesets only, commitlint skipped)
   - ~~Decide `sideEffects` flags and tree-shaking policy.~~ ✓ Done (`sideEffects: false` on both packages)
   - ~~Decide peer/dependency policy for Motion and Floating UI.~~ ✓ Done (Motion=peer, Floating UI=dep)

4. Product decisions to close
   - ~~Default outside-click behavior (advance/dismiss/no-op).~~ ✓ Keep as-is (passthrough/block modes)
   - ~~Minimum browser support + polyfills.~~ ✓ Modern only (Chrome/Edge 90+, Firefox 90+, Safari 15+)
   - ~~Persistence/version migration policy.~~ Done (semantic versioning with migration support)

5. Optional/roadmap
   - Declarative `<Flow>/<Step>` API decision for v0.
   - Defer branching flows, plugin ecosystem, Shadow DOM/iframe.
   - ~~i18n surface~~ ✓ Done (labels prop on TourProvider, useTourLabels hook)

How to run examples

- `pnpm --filter @flowsterix/example-react-vite dev`
- `pnpm --filter @flowsterix/example-react-router-vite dev`
- `pnpm --filter @flowsterix/example-next dev`
- `pnpm --filter @flowsterix/shadcn-demo dev`
