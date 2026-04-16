---
skill: eslint-flat-config
type: eslint
applies-when: Writing the lint script in package.json for a Vite-scaffolded project
---

## Problem

`npm run lint` fails or produces unexpected results when using `--ext .ts,.tsx`.

## Root cause

`create-vite` generates `eslint.config.js` using ESLint 9 flat config format.
The `--ext` flag is a legacy ESLint 8 option; ESLint 9 ignores it — file patterns
are defined inside `eslint.config.js` via the `files` array.

## Fix

`package.json` lint script:
```json
"lint": "eslint . --max-warnings 0"
```

Not:
```json
"lint": "eslint src --ext .ts,.tsx --max-warnings 0"
```

## Prevention

Use `eslint . --max-warnings 0` in CLAUDE.md quality gate commands.
