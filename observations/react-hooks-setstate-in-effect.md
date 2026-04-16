---
skill: react-hooks-setstate-in-effect
type: react
applies-when: Writing a useEffect that triggers a fetch based on updated state
---

## Problem

`npm run lint` fails with:
```
react-hooks/set-state-in-effect: Calling setState synchronously within an effect
can trigger cascading renders
```

Caused by calling `setState(...)` at the top of a `useEffect` body before the async
operation, e.g. to reset back to a loading state.

## Root cause

`eslint-plugin-react-hooks` enforces that `setState` inside effects be called only
inside async callbacks or event handlers — not synchronously at the effect's top level.

## Fix

Remove the synchronous `setState` call from the effect body. The initial `useState`
value (`{ status: 'loading' }`) already covers the loading state before the effect
runs for the first time. No reset is needed.

## Prevention

In hooks that fetch data: set the initial state to `{ status: 'loading' }` via
`useState` and let the async `.then()` / `.catch()` callbacks update state.
Never call `setState(...)` synchronously at the top of a `useEffect`.
