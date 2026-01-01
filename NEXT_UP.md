# Next Up (Prioritized)

1. Testing and QA coverage
   - Expand unit tests for core engine, adapters, and persistence.
   - Add Playwright smoke tests for DOM targeting, routing, and flows.
   - Add visual snapshot coverage for themes/placements.

2. Example apps and docs
   - Build `examples/next` (App Router first, Pages Router if needed).
   - Add a React Router example (or update existing example to include it).
   - Document setup for adapters, storage, and theming.

3. Release readiness
   - Add Changesets + commitlint and a release checklist.
   - Decide `sideEffects` flags and tree-shaking policy.
   - Decide peer/dependency policy for Motion and Floating UI.

4. Product decisions to close
   - Default outside-click behavior (advance/dismiss/no-op).
   - Minimum browser support + polyfills.
   - Persistence/version migration policy.

5. Optional/roadmap
   - Declarative `<Flow>/<Step>` API decision for v0.
   - Defer branching flows, i18n surface, plugin ecosystem, Shadow DOM/iframe.
