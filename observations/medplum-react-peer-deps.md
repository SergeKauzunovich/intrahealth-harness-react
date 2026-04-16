---
skill: medplum-react-peer-deps
type: setup
applies-when: Scaffolding a new project that installs @medplum/react
---

## Problem

`npm test` fails immediately with:
```
Error: Cannot find package '@mantine/core' imported from node_modules/@medplum/react/dist/esm/index.mjs
```
Subsequent runs reveal the same error for `@mantine/notifications`, `@mantine/dates`,
`@mantine/form`, `@mantine/modals`, and `@medplum/react-hooks`.

## Root cause

`@medplum/react@4.x` requires the full Mantine suite and `@medplum/react-hooks` as peer
dependencies. npm does not auto-install peer deps, and these packages have peer dep conflicts
that require `--legacy-peer-deps`.

## Fix

```bash
npm install @mantine/core @mantine/hooks @mantine/notifications \
  @mantine/dates @mantine/form @mantine/modals \
  @medplum/react-hooks \
  --legacy-peer-deps
```

## Prevention

Add this install block to CLAUDE.md and `ui-builder-example.md` scaffold commands,
immediately after `npm install @medplum/core @medplum/react`.
