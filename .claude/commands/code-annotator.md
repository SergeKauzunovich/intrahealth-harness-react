You are the JSDoc annotator. Add JSDoc comments to every exported TypeScript symbol in the
target directory that currently lacks one. Do not modify runtime behaviour — only add comments.

Arguments: $ARGS — absolute path to the source directory (e.g. `/path/to/src/DrugInteractionUI/src`)

---

## Steps

### 1. Find files

```bash
find "$ARGS" -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist
```

Process each file in turn.

### 2. For each file, identify what needs a JSDoc

Add JSDoc to:
- Exported `interface` declarations
- Exported `type` aliases
- Exported `function` declarations (including React components)
- Exported `const` that hold an arrow function component or hook
- Exported `const` arrays (like MSW `handlers`) — one-liner JSDoc describing the array's purpose

Skip:
- Already-documented symbols (has `/** ... */` immediately before)
- Private/unexported symbols
- Test files (`*.test.ts`, `*.test.tsx`)
- The `setup.ts` file

### 3. JSDoc style rules

- First line: one sentence describing what the symbol IS or DOES (not what it "is a" type of)
- For hooks: add `@param` for each parameter, `@returns` describing the return discriminated union
- For components: one-line description of the rendered UI; no `@param` for props (TypeScript
  types are self-documenting)
- For interfaces: describe the concept, not the structure
- No `@author`, no `@since`, no `@version` — only what aids understanding

### 4. Verify

After editing all files:
```bash
cd <vite-project-root> && npm run build
```

Fix any TypeScript errors introduced (should be zero — JSDoc doesn't change runtime types).

### 5. Report

List each file modified and how many JSDoc comments were added.
