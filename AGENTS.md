# Agent Guidance

- If `packages/core` or `packages/react` changes, add a changeset so `CHANGELOG.md` and package version are updated via `pnpm run version`.
- Never edit `dist/` files by hand.
- If behavior changes in `packages/core` or `packages/react`, add or update tests in that same package.
- If public API, exported types, or configuration surface changes, update that package's `README.md`.
- Before finishing `core`/`react` work, run `test`, `typecheck`, and `build` for each touched package with `pnpm --filter @flowsterix/<pkg> ...`.
- For shadcn component changes, edit the source shadcn components first, then run `pnpm sync:shadcn-examples` and `pnpm build:web:registry` from the repository root.
- Use Changesets for versioning (`.changeset/*` + `pnpm run version`); do not manually edit package versions.
- Keep package versions independent (`linked: []`); avoid lockstep versioning across `core`, `react`, and `studio`.
