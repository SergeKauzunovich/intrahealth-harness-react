---
skill: testing-library-dom
type: testing
applies-when: Installing @testing-library/react in a new project
---

## Problem

Tests fail to run with:
```
Error: Cannot find module '@testing-library/dom'
Require stack: node_modules/@testing-library/react/dist/pure.js
```

## Root cause

`@testing-library/react@16.x` requires `@testing-library/dom` as a peer dependency.
It is not automatically installed by npm.

## Fix

```bash
npm install @testing-library/dom --legacy-peer-deps
```

## Prevention

Add `@testing-library/dom` explicitly to the `-D` install block in CLAUDE.md:
```bash
npm install -D vitest @testing-library/react @testing-library/dom \
  @testing-library/jest-dom @testing-library/user-event msw jsdom
```
