---
skill: vitest-vite-config
type: setup
applies-when: Configuring Vitest inside a Vite project
---

## Problem

`npm run build` fails with:
```
vite.config.ts: error TS2769: Object literal may only specify known properties,
and 'test' does not exist in type 'UserConfigExport'
```
Also: test globals (`describe`, `it`, `expect`, `vi`) are unknown to TypeScript.

## Root cause

Importing `defineConfig` from `vite` gives no knowledge of the `test` property.
TypeScript globals for Vitest are not included in `vite/client` types.

## Fix

`vite.config.ts` — import from `vitest/config`, not `vite`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' },
});
```

`tsconfig.app.json` and `tsconfig.node.json` — add `"vitest/globals"` to `types`:
```json
"types": ["vite/client", "vitest/globals"]
```

## Prevention

Add corrected `vite.config.ts` and both tsconfig snippets to `ui-builder-example.md`
scaffold section.
