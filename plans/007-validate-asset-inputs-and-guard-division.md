# Plan 007: Validate asset inputs and guard division by zero

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/components/AddAssetDialog.tsx src/components/AssetTable.tsx src/components/Dashboard.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `728d33f`, 2026-06-12

## Why this matters

Users can submit assets with zero weight, zero purity, or zero cost because the form validation (`AddAssetDialog.tsx:70-75`) only checks string truthiness, and `"0"` is truthy. A zero-cost asset causes `Infinity%` to render in the AssetTable P&L column (division by zero on line 51). The Dashboard has the guard but the table doesn't. This is a data integrity issue: invalid assets persist to localStorage and produce misleading UI until manually deleted.

## Current state

`src/components/AddAssetDialog.tsx:70-75` — validation only checks non-empty strings:
```typescript
const isValid =
  name &&
  weight &&
  purity &&
  cost &&
  purchaseDate
```

`src/components/AddAssetDialog.tsx:57-60` — raw `Number()` conversion with no range check:
```typescript
weight: Number(weight),
purity: Number(purity),
cost: Number(cost),
```

`src/components/AssetTable.tsx:51` — unguarded division by zero:
```typescript
const pnlPercent = (pnl / asset.cost) * 100
```

`src/components/Dashboard.tsx:19` — has the guard (for reference on the pattern):
```typescript
const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/components/AddAssetDialog.tsx` — add numeric validation (positive values, purity range)
- `src/components/AssetTable.tsx` — add division-by-zero guard for P&L

**Out of scope**:
- `src/components/Dashboard.tsx` — already has the guard, not touched
- `src/lib/calculations.ts` — P&L deduplication is a separate plan (012)
- Adding a test framework
- Changing the form UI layout or styling

## Git workflow

- Branch: `advisor/007-validate-asset-inputs`
- Commit message: `fix: validate asset inputs and guard division by zero in table`
- One commit
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add numeric range validation in AddAssetDialog

In `src/components/AddAssetDialog.tsx`, replace the `isValid` block (lines 70-75) with validation that checks both presence AND numeric ranges:

```typescript
const weightNum = Number(weight)
const purityNum = Number(purity)
const costNum = Number(cost)
const isValid =
  name.trim() !== "" &&
  weight !== "" && weightNum > 0 &&
  purity !== "" && purityNum > 0 && purityNum <= 100 &&
  cost !== "" && costNum > 0 &&
  purchaseDate !== ""
```

This ensures:
- `weight` is a positive number (no zero-weight assets)
- `purity` is between 0 (exclusive) and 100 (inclusive)
- `cost` is a positive number (no free assets)
- Empty or whitespace-only names are rejected

**Verify**: `npx tsc -b` → exit 0

### Step 2: Guard division by zero in AssetTable

In `src/components/AssetTable.tsx`, change line 51 from:
```typescript
const pnlPercent = (pnl / asset.cost) * 100
```
to:
```typescript
const pnlPercent = asset.cost > 0 ? (pnl / asset.cost) * 100 : 0
```

This matches the exact guard pattern already used in `Dashboard.tsx:19`.

**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

No test infrastructure exists. Manual verification:
1. Open the app, click "+ Añadir activo"
2. Try submitting with weight=0, purity=0, cost=0 — the "Guardar" button should be disabled
3. Enter valid values and submit — works as before
4. Submit a valid asset, then open DevTools and run `localStorage.setItem("gold-tracker:assets", JSON.stringify([{...existingAsset, cost: 0}]))` to simulate a legacy zero-cost asset. Refresh the page — the table should show "0,00 €" or "0,00%" instead of "Infinity%"

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `AddAssetDialog.tsx` has numeric validation checking `weight > 0`, `purity > 0 && purity <= 100`, `cost > 0`
- [ ] `AssetTable.tsx:51` has `asset.cost > 0` guard before division
- [ ] No files outside `AddAssetDialog.tsx` and `AssetTable.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The fix requires touching an out-of-scope file.

## Maintenance notes

- If the form is extended with more numeric fields, add validation for each one following the pattern in Step 1.
- The purity range (`> 0 && <= 100`) assumes percentage input. If the app ever adds karat input (e.g., 24kt, 22kt), a conversion function would be needed before the range check.
- The `asset.cost > 0` guard handles legacy zero-cost assets that may already exist in localStorage. Those assets will show P&L as 0% instead of Infinity — they remain in storage but no longer break the UI.