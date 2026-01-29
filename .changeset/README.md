# Changesets

This folder contains changesets - markdown files that describe changes to the codebase.

## Adding a changeset

Run `pnpm changeset` to create a new changeset. You'll be prompted to:

1. Select which packages have changed
2. Choose the semver bump type (patch/minor/major)
3. Write a summary of the changes

## Release workflow

1. Create changesets as you work: `pnpm changeset`
2. When ready to release: `pnpm changeset version`
3. Review generated CHANGELOGs
4. Release is done within a github action when commited and pushed
