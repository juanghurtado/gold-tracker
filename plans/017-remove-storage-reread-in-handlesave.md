# Plan 017: Remove unnecessary localStorage re-read in handleSaveAsset

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- src/App.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

`handleSaveAsset` in App.tsx calls `saveAsset(asset)` (already writes to localStorage) then immediately calls `getAssets()` (reads everything back) just to set React state. This performs an unnecessary JSON serialization round-trip. The component already has the current asset list in state — it can derive the new list with a functional state update.

## Current state

`src/App.tsx:53-56`:
```typescript
function handleSaveAsset(asset: Asset) {
    saveAsset(asset)
    setAssets(getAssets())
}
```

`saveAsset` at `storage.ts:29-33` already writes the array (with the new asset appended) to localStorage. Then `getAssets()` reads and parses the array back. The resulting value is always `[...oldAssets, asset]`, which is derivable from React state without touching localStorage.

**Repo convention**: React state updates use the functional updater pattern where they derive from previous state. See how other state setters work in the same file (e.g., `setMetalPrice(price)`, `setAddOpen(false)` — though those are simple values). The pattern `setAssets(prev => [...prev, asset])` matches the standard React idiom and is consistent with how the rest of the app manages state.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Test      | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope** (the only file you should modify):
- `src/App.tsx` — one line change

**Out of scope** (do NOT touch):
- No other files
- The `handleDeleteAsset` function at `App.tsx:58-61` also uses `setAssets(getAssets())` — leave it alone for now (it's the same pattern but involves filtering; leave it to a separate plan)
- `storage.ts` — no changes needed

## Steps

### Step 1: Replace `setAssets(getAssets())` with functional updater

In `src/App.tsx`, change line 55 from:
```typescript
    setAssets(getAssets())
```
to:
```typescript
    setAssets((prev) => [...prev, asset])
```

Do NOT remove the `saveAsset(asset)` call on line 54 — localStorage still needs to be updated.

**Verify**: `grep -n "getAssets" src/App.tsx` → the only remaining `getAssets()` call should be in the initial state (`useState(() => getAssets())`) and in `handleDeleteAsset` — NOT in `handleSaveAsset`. If `handleSaveAsset` still calls `getAssets()`, the change wasn't applied.

### Step 2: Verify

**Verify**: `npm test` → all tests pass
**Verify**: `npm run lint` → exit 0
**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

No new tests needed. The existing component tests (`Dashboard.test.tsx`, `AssetTable.test.tsx`) render components that consume `assets` prop — they don't test data flow through App.tsx directly. Manual verification:
- Add an asset via the UI, confirm it appears immediately in the table and dashboard.
- Refresh the page, confirm the asset persists (it's still in localStorage).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `handleSaveAsset` in `src/App.tsx` uses `setAssets((prev) => [...prev, asset])` NOT `setAssets(getAssets())`
- [ ] `saveAsset(asset)` is still called in `handleSaveAsset` (data still persists to localStorage)
- [ ] Only `src/App.tsx` is modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the location in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- `handleDeleteAsset` (`App.tsx:58-61`) has the same pattern and could benefit from the same treatment, but is out of scope for this plan.
- This change is purely internal to App.tsx — no component props or behavior changes.