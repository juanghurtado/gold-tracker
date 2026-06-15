# Plan 014: Scope ErrorBoundary's data-clear to only app keys

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- src/lib/storage.ts src/components/ErrorBoundary.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

The "Vaciar datos" button in `ErrorBoundary.tsx` calls `localStorage.clear()`, which **wipes every key for the entire origin** — not just `gold-tracker:` prefixed keys. If the user has other apps or tools using localStorage on the same subdomain (e.g. `localhost` during development, or a shared GitHub Pages subdomain), those will lose all their data. The fix is to scope clearing to only the app's own keys.

## Current state

`src/components/ErrorBoundary.tsx:45-49` — the recovery button calls `localStorage.clear()`:
```typescript
<button
  onClick={() => {
    localStorage.clear()
    window.location.reload()
  }}
>
  Vaciar datos
</button>
```

`src/lib/storage.ts` — all app keys use the `gold-tracker:` prefix:
```typescript
const ASSETS_KEY = "gold-tracker:assets"
const API_KEY_KEY = "gold-tracker:api-key"
const METAL_PRICE_KEY = "gold-tracker:metal-price"
```

No function currently exists to clear only prefixed keys.

**Repo convention**: All storage functions live in `src/lib/storage.ts`. Error handling in storage functions wraps in try/catch with `console.warn` fallback (see `setItem` at `storage.ts:16-22`). The ErrorBoundary component uses native `<button>` elements (not the `Button` UI component) — see its existing recovery buttons at lines 39-53.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Build     | `npm run build`          | exit 0              |
| Lint      | `npm run lint`           | exit 0 (no src/ errors) |
| Tests     | `npm test`               | 50+ tests pass      |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/lib/storage.ts` — add `clearAppData()` function
- `src/components/ErrorBoundary.tsx` — replace `localStorage.clear()` with `clearAppData()`
- `src/lib/storage.test.ts` — add tests for `clearAppData()`

**Out of scope** (do NOT touch, even though they look related):
- Adding a `clearAppData` export to barrels or any other files
- Changing the ErrorBoundary's other recovery button ("Recargar") — it only calls `window.location.reload()` which is correct
- Any UI styling changes

## Steps

### Step 1: Add `clearAppData()` to storage.ts

Add the following function at the end of `src/lib/storage.ts` (after the `saveMetalPrice` function, before the final closing of the file):

```typescript
export function clearAppData(): void {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith("gold-tracker:")) {
        localStorage.removeItem(key)
      }
    }
  } catch (e) {
    console.warn("Failed to clear app data:", e)
  }
}
```

This iterates all localStorage keys and removes only those with the `gold-tracker:` prefix. It wraps in try/catch to match the existing `setItem` error-handling pattern (`storage.ts:16-22`).

**Verify**: `grep -n "export function clearAppData" src/lib/storage.ts` → outputs the line number where the function exists.

### Step 2: Replace `localStorage.clear()` in ErrorBoundary

In `src/components/ErrorBoundary.tsx`, change line 47 from:
```typescript
localStorage.clear()
```
to:
```typescript
clearAppData()
```

Also add the import at the top of the file (add after the `import { Component, type ReactNode } from "react"` line):
```typescript
import { clearAppData } from "../lib/storage"
```

**Verify**: `grep -n "localStorage.clear" src/components/ErrorBoundary.tsx` → returns no matches
**Verify**: `grep -n "clearAppData" src/components/ErrorBoundary.tsx` → shows the import line and the usage line

### Step 3: Add tests for `clearAppData()`

Add a `describe("clearAppData")` block at the end of `src/lib/storage.test.ts` (before the closing `});` if there's a top-level wrapper, or at the bottom of the file).

Follow the existing test patterns — `beforeEach(() => { localStorage.clear() })` is already at the top of the test file.

The test block should test:
1. **Clears app keys but preserves other keys**: Set a `gold-tracker:assets` key and a foreign key (e.g. `other-app:data`). Call `clearAppData()`. Assert `gold-tracker:assets` is gone but `other-app:data` survives.
2. **No-op when no app keys exist**: No keys set, or only foreign keys set. Call `clearAppData()`. Assert no errors and foreign keys unchanged.
3. **Handles malformed keys gracefully**: Just call it — the function iterates `Object.keys` which never throws.

Model tests after the existing `getAssets` / `saveAsset` patterns in `src/lib/storage.test.ts:33-82`. Use the same `beforeEach` (already in place).

**Verify**: `npm test -- src/lib/storage.test.ts` → 17+ tests pass (14 existing + 3 new), new tests specifically for `clearAppData`.

### Step 4: Verify whole suite

**Verify**: `npm test` → 53+ tests pass (50 existing + 3 new for storage + any from plan 015)
**Verify**: `npm run lint` → exit 0 (no src/ errors)
**Verify**: `npm run build` → exit 0
**Verify**: `npx tsc -b` → exit 0

## Test plan

- **File**: `src/lib/storage.test.ts`
- **New tests**: 3 tests under `describe("clearAppData")`:
  1. "removes gold-tracker prefixed keys but leaves other keys intact"
  2. "does nothing when no app keys exist"
  3. "does not throw when localStorage is empty"
- **Pattern**: Follow the existing `getAssets` describe block (`storage.test.ts:33-46`) — uses `beforeEach` from the top of the file, `localStorage.setItem` for setup, `expect(getAssets())` or `expect(localStorage.getItem(...))` for assertions.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` exits 0; new tests for `clearAppData` exist and pass
- [ ] `grep -rn "localStorage.clear" src/` returns no matches
- [ ] `grep -rn "clearAppData" src/lib/storage.ts` shows the function definition
- [ ] `grep -rn "clearAppData" src/components/ErrorBoundary.tsx` shows import + usage
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- The import path `../lib/storage` doesn't resolve from ErrorBoundary.tsx (it should — it's at `src/components/ErrorBoundary.tsx`, storage is at `src/lib/storage.ts`, the same path used by `src/App.tsx:3`).

## Maintenance notes

- If new storage keys are added in the future, they MUST use the `gold-tracker:` prefix for `clearAppData()` to work correctly. If a key without this prefix is accidentally introduced, `clearAppData()` will not clear it. Enforce the prefix convention in code review.
- `clearAppData()` does NOT call `window.location.reload()` — the ErrorBoundary handles that separately. If someone adds a new clear-data entry point, they should call `clearAppData()` followed by `window.location.reload()` (or `router.reload()`) to match the existing UX.