# Plan 009: Guard localStorage setItem against QuotaExceededError

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/lib/storage.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `728d33f`, 2026-06-12

## Why this matters

`localStorage.setItem` throws a `DOMException` ("QuotaExceededError") when the browser's storage is full. This happens in Safari private browsing (~2 MB quota), when the user has many assets, or when the browser tab has accumulated large cached data. The `setItem` function in `storage.ts` has no try/catch around its write — unlike `getItem` (which does). Any failed write causes an uncaught exception that propagates up through `saveAsset`, `saveApiKey`, or `saveMetalPrice` and crashes the calling code.

## Current state

`src/lib/storage.ts:7-18` — the getter has error handling, the setter does not:
```typescript
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}
```

The three callers of `setItem` — `saveAsset` (line 28), `saveApiKey` (line 47), and `saveMetalPrice` (line 56) — have no error handling of their own. Wrapping `setItem` itself is the single point of fix.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/lib/storage.ts` — add try/catch to `setItem`, log a warning

**Out of scope**:
- Any other files
- Showing a UI error to the user on quota failure (that's a UX concern, not a crash-prevention one — this plan just prevents the crash)
- Changing `getItem` or any other function

## Git workflow

- Branch: `advisor/009-guard-setitem`
- Commit message: `fix: guard localStorage.setItem against quota errors`
- One commit
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Wrap `setItem` in try/catch

In `src/lib/storage.ts`, replace the `setItem` function (lines 16-18) with:

```typescript
function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`Failed to write to localStorage key "${key}":`, e)
  }
}
```

This catches the `QuotaExceededError` (and any other localStorage write error), logs a warning to the console so the issue is visible during debugging, and fails gracefully — the save simply doesn't persist, but the app continues to function in-memory.

The `getItem` function already has the same try/catch pattern (lines 8-13) — this change makes the two functions symmetric.

**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

No test infrastructure exists. Manual verification:
1. Open the app in a normal browser tab — add an asset, verify it still saves and persists on reload.
2. To test quota failure: open Chrome DevTools > Application > Local Storage > Clear. Then run this in console to fill the quota: `for (let i = 0; i < 100000; i++) localStorage.setItem("fill-" + i, "x".repeat(1024))`. Then try adding an asset in the app — the console should show a warning message, and the app should not crash.
3. Reload the page — the asset added during the quota test won't be there (expected, the write silently failed).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/lib/storage.ts`'s `setItem` function contains a `try { ... } catch` block
- [ ] The catch block calls `console.warn` with the key name
- [ ] No files outside `src/lib/storage.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- ESLint's `no-console` rule would flag `console.warn` — if so, check `eslint.config.js`; the current config doesn't enable this rule, so it shouldn't be an issue.

## Maintenance notes

- The warning is intentionally a `console.warn` so developers see it during development. If the app ever adds a user-facing notification system, consider upgrading this to a toast or non-blocking alert so users know their data didn't save.
- If the app later uses `IndexedDB` (via the `storage` library), that API has its own error handling patterns — don't blindly apply this try/catch pattern there.
- This change does not solve the underlying problem (storage quota full), it just prevents a crash. A future improvement could show a warning banner: "No hay suficiente espacio de almacenamiento. Libera espacio o exporta tus datos."