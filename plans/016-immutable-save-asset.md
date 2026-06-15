# Plan 016: Fix saveAsset to use immutable array spread

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- src/lib/storage.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

`saveAsset` mutates the array returned by `getAssets()` with `.push()`, then writes it to localStorage. While currently safe (JSON.parse returns a fresh array each call), this is a brittle pattern — any future change that caches the parsed array or returns a shared reference would silently corrupt data. Using the spread operator makes the code robust against such changes and communicates intent clearly.

## Current state

`src/lib/storage.ts:29-33`:
```typescript
export function saveAsset(asset: Asset): void {
  const assets = getAssets()
  assets.push(asset)
  setItem(ASSETS_KEY, assets)
}
```

`getAssets()` at `storage.ts:25-27` returns a fresh array from JSON.parse:
```typescript
export function getAssets(): Asset[] {
  return getItem<Asset[]>(ASSETS_KEY, [])
}
```

The `getItem` helper at `storage.ts:7-14` calls `JSON.parse(raw)` on each invocation, so the returned array is always a new reference. The mutation is safe today — but invisible to a reader who hasn't traced through `getItem`.

**Repo convention**: Minimal, functional-style code. The rest of the codebase avoids mutations — `deleteAsset` at `storage.ts:35-38` correctly uses `.filter()` to create a new array:
```typescript
export function deleteAsset(id: string): void {
  const assets = getAssets().filter((a) => a.id !== id)
  setItem(ASSETS_KEY, assets)
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Test      | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope** (the only file you should modify):
- `src/lib/storage.ts` — one line change

**Out of scope** (do NOT touch):
- No other files
- No test changes needed — existing tests for `saveAsset` verify behavior, not implementation details

## Steps

### Step 1: Replace `.push()` with spread in `saveAsset`

In `src/lib/storage.ts`, change lines 30-32 from:
```typescript
  const assets = getAssets()
  assets.push(asset)
  setItem(ASSETS_KEY, assets)
```
to:
```typescript
  const assets = [...getAssets(), asset]
  setItem(ASSETS_KEY, assets)
```

This creates a new array with the existing assets plus the new one, then writes it. No mutation of the intermediate array.

**Verify**: `grep -n "\.push" src/lib/storage.ts` → returns no matches

### Step 2: Verify

**Verify**: `npm test -- src/lib/storage.test.ts` → all 14+ tests pass (the save/delete tests still work)
**Verify**: `npm test` → all tests pass
**Verify**: `npm run lint` → exit 0
**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

No new tests needed. The existing tests in `src/lib/storage.test.ts` already cover:
- `saveAsset` stores and retrieves one asset (line 51-53)
- `saveAsset` appends multiple assets (line 57-60)

These same tests verify the spread-based implementation works correctly.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -n "\.push" src/lib/storage.ts` returns no matches
- [ ] `saveAsset` in `src/lib/storage.ts` uses `[...getAssets(), asset]` pattern
- [ ] Only `src/lib/storage.ts` is modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the location in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- This change is a pure refactor — behavior is identical. No future maintenance needed.
- If `saveAsset` is ever extended to deduplicate by ID or validate before saving, the spread pattern composes naturally with `.filter()` (model on the existing `deleteAsset`).