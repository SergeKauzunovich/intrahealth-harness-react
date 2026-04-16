---
skill: medplum-react-peer-deps
type: setup
applies-when: Scaffolding a new project that installs @medplum/react
---

## Problem

`npm install` fails with ERESOLVE:
```
Could not resolve dependency:
peer @mantine/core@"9.0.2" from @mantine/dates@9.0.2
Found: @mantine/core@7.17.8
```

Also: `npm test` fails with "Cannot find package '@mantine/core'" if Mantine packages
are missing entirely. Installing them without version constraints pulls mixed major
versions (core@7 from @medplum peer hint, others@9 as npm latest), causing ERESOLVE on
the next clean `npm install`.

## Root cause

`@medplum/react@4.x` declares `peerOptional @mantine/core@^7.0.0`. npm uses this hint
for `@mantine/core` and `@mantine/hooks`, but ignores it when resolving
`@mantine/dates`, `@mantine/form`, `@mantine/modals`, and `@mantine/notifications` —
those land on their own npm-latest (v9). v9 packages require `@mantine/core@9`, which
conflicts with the v7 core already present.

`@medplum/react-hooks` and `@testing-library/dom` are also not auto-installed despite
being required at runtime.

## Fix

Pin ALL Mantine packages to `^7` and install everything in one command:

```bash
npm install \
  @mantine/core@^7 @mantine/hooks@^7 @mantine/notifications@^7 \
  @mantine/dates@^7 @mantine/form@^7 @mantine/modals@^7 \
  @medplum/react-hooks \
  @testing-library/dom \
  --legacy-peer-deps
```

`--legacy-peer-deps` is still required for React 19 peer dep declarations in some packages.

## Prevention

Use explicit `@^7` version constraints for every Mantine package in the scaffold commands.
Never install Mantine packages in separate `npm install` calls — one command ensures npm
resolves them together and picks a consistent version tree.

Updated scaffold block for CLAUDE.md:
```bash
npm install \
  @mantine/core@^7 @mantine/hooks@^7 @mantine/notifications@^7 \
  @mantine/dates@^7 @mantine/form@^7 @mantine/modals@^7 \
  @medplum/react-hooks @testing-library/dom \
  --legacy-peer-deps
```
