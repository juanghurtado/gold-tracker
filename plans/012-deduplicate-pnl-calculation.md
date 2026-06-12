# Plan 012: Deduplicate P&L calculation into calculations.ts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/lib/calculations.ts src/components/Dashboard.tsx src/components/AssetTable.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 011 (the `calculations.ts` module must already have `calculateSpotEurPerOz`)
- **Category**: tech-debt
- **Planned at**: commit `728d33f`, 2026-06-12

## Why this matters

The P&L calculation (`pnl = value - cost`, `pnlPercent = (pnl / cost) * 100`) is duplicated across `Dashboard.tsx` (lines 18-19) and `AssetTable.tsx` (lines 50-51). This duplication already caused a bug: `Dashboard.tsx:19` has a zero-cost guard (`totalCost > 0`), but `AssetTable.tsx:51` does not — the same fix had to be applied in two places. Extracting to `calculations.ts` ensures the guard logic lives in one place and both components automatically benefit.

## Current state

`src/components/Dashboard.tsx:18-19`:
```typescript
const pnl = totalValue - totalCost
const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
```

`src/components/AssetTable.tsx:50-51` (inside a `map` over individual assets):
```typescript
const pnl = value - asset.cost
const pnlPercent = asset.cost > 0 ? (pnl / asset.cost) * 100 : 0
```

Note: the Dashboard operates on aggregate values (summed across all assets), while the AssetTable operates on per-asset values. This means the P&L functions need two variants:
- `assetPnL(asset, spotEurPerOz)` — returns `{ pnl, pnlPercent }` for a single asset
- `portfolioPnL(assets, spotEurPerOz)` — returns `{ pnl, pnlPercent }` for the whole portfolio

`src/lib/calculations.ts` already contains `currentValue` and is the right home for these.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/lib/calculations.ts` — add `assetPnL` and `portfolioPnL` functions
- `src/components/Dashboard.tsx` — use `portfolioPnL` instead of inline calculation
- `src/components/AssetTable.tsx` — use `assetPnL` instead of inline calculation

**Out of scope**:
- `src/lib/api.ts` — untouched
- Changing the return type or behavior of any existing function
- Any formatting of the P&L values (formatting is a display concern, kept in components)

## Git workflow

- Branch: `advisor/012-deduplicate-pnl`
- Commit message: `refactor: extract P&L calculation to shared functions in calculations.ts`
- One commit
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add P&L functions to calculations.ts

In `src/lib/calculations.ts`, import `Asset` and `MetalPrice` types (add `MetalPrice` if not already imported — it should be from plan 011):

```typescript
import type { Asset, MetalPrice } from "../types"
```

Then add these two functions after `calculateSpotEurPerOz`:

```typescript
export function assetPnL(asset: Asset, spotEurPerOz: number): { pnl: number; pnlPercent: number } {
  const value = currentValue(asset, spotEurPerOz)
  const pnl = value - asset.cost
  const pnlPercent = asset.cost > 0 ? (pnl / asset.cost) * 100 : 0
  return { pnl, pnlPercent }
}

export function portfolioPnL(assets: Asset[], spotEurPerOz: number): { pnl: number; pnlPercent: number } {
  const totalCost = assets.reduce((sum, a) => sum + a.cost, 0)
  const totalValue = assets.reduce((sum, a) => sum + currentValue(a, spotEurPerOz), 0)
  const pnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  return { pnl, pnlPercent }
}
```

**Verify**: `npx tsc -b` → exit 0

### Step 2: Update Dashboard to use portfolioPnL

In `src/components/Dashboard.tsx`:
1. Replace the import of `currentValue` with `portfolioPnL` (and keep `calculateSpotEurPerOz`):
```typescript
import { calculateSpotEurPerOz, portfolioPnL } from "../lib/calculations"
```
2. Remove the now-unused import of `currentValue`.
3. Replace lines 13-19 (the inline calculation) with:
```typescript
const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
const { pnl, pnlPercent } = portfolioPnL(assets, spotEurPerOz)
```
4. Remove the unused `totalCost` and `totalValue` local variables (lines 13-17). The `totalValue` is still referenced in the JSX on lines 52 and 56 — replace `totalValue` with the return from `portfolioPnL`... wait, `portfolioPnL` currently doesn't return `totalValue`. 

Actually, looking at the Dashboard JSX more carefully:
- Line 52-56 renders `totalValue` in the "Valor actual" card
- `portfolioPnL` needs to also return `totalValue` and `totalCost` for the display

Let me reconsider the P&L function design. The Dashboard needs `totalCost`, `totalValue`, `pnl`, and `pnlPercent`. Currently all four are computed inline.

Better approach: have `portfolioPnL` return just pnl and pnlPercent, and keep `totalCost`/`totalValue` inline in Dashboard. That way we only deduplicate the P&L-specific logic (which is where the bug was).

Actually, a simpler and more correct approach: `portfolioPnL` should return `{ totalCost, totalValue, pnl, pnlPercent }` since all four are used in the Dashboard. But that makes the function do more than P&L. Let me just have it return what's needed.

Alternative: keep `totalCost` and `totalValue` computation inline in Dashboard (they're trivial reduces), and only extract the `pnl` / `pnlPercent` logic. But that barely deduplicates anything since the pnl formula is just `totalValue - totalCost`.

Actually, looking again at the Dashboard, the main deduplication value is in the per-asset P&L used by AssetTable (which had the missing guard). For Dashboard, the current code is fine — the guard is already there. The real value is unifying the per-asset P&L.

So the plan should focus on:
- Adding `assetPnL(asset, spotEurPerOz)` for AssetTable use
- Adding `portfolioPnL(...)` that returns `{ totalCost, totalValue, pnl, pnlPercent }` for Dashboard use

Let me revise step 1:

```typescript
export function assetPnL(asset: Asset, spotEurPerOz: number): { pnl: number; pnlPercent: number } {
  const value = currentValue(asset, spotEurPerOz)
  const pnl = value - asset.cost
  const pnlPercent = asset.cost > 0 ? (pnl / asset.cost) * 100 : 0
  return { pnl, pnlPercent }
}

export function portfolioPnL(assets: Asset[], spotEurPerOz: number): { totalCost: number; totalValue: number; pnl: number; pnlPercent: number } {
  const totalCost = assets.reduce((sum, a) => sum + a.cost, 0)
  const totalValue = assets.reduce((sum, a) => sum + currentValue(a, spotEurPerOz), 0)
  const pnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  return { totalCost, totalValue, pnl, pnlPercent }
}
```

Then Dashboard can destructure all four values.

**Verify**: `npx tsc -b` → exit 0

### Step 3: Update Dashboard to use portfolioPnL

Replace the inline calculations (lines 12-19) with:
```typescript
const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
const { totalCost, totalValue, pnl, pnlPercent } = portfolioPnL(assets, spotEurPerOz)
```

Import `portfolioPnL` instead of `currentValue`:
```typescript
import { calculateSpotEurPerOz, portfolioPnL } from "../lib/calculations"
```

Remove the unused `currentValue` import.

The JSX references `totalCost` (line 37), `totalValue` (lines 52, 56), `pnl` (line 78), `pnlPercent` (line 89), and `spotEurPerOz` (line 59) — all are already destructured.

**Verify**: `npx tsc -b` → exit 0

### Step 4: Update AssetTable to use assetPnL

In `src/components/AssetTable.tsx`:
1. Replace the import of `currentValue` with `assetPnL`:
```typescript
import { calculateSpotEurPerOz, assetPnL } from "../lib/calculations"
```
2. Replace lines 49-51 inside the map with:
```typescript
const { pnl, pnlPercent } = assetPnL(asset, spotEurPerOz)
```
The `value` variable was only used via `currentValue(asset, spotEurPerOz)` which is now inside `assetPnL`.
3. Remove the unused `currentValue` import.

**Verify**: `npx tsc -b` → exit 0

**Verify final**: `npm run lint` → exit 0
**Verify final**: `npm run build` → exit 0

## Test plan

No test infrastructure exists. Manual verification:
1. `npm run dev` — Dashboard shows: correct asset count, cost, current value, P&L, P&L%.
2. AssetTable shows: correct per-row value, P&L, P&L%.
3. Add an asset with a very small cost (e.g., €0.01) and verify P&L% calculations are reasonable.
4. Add an asset with `cost: 0` via DevTools localStorage manipulation — the table shows "0,00%" instead of "Infinity%" (the guard from plan 007 is now in the shared function).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/lib/calculations.ts` exports `assetPnL` function
- [ ] `src/lib/calculations.ts` exports `portfolioPnL` function
- [ ] `src/components/Dashboard.tsx` uses `portfolioPnL` instead of inline P&L computation
- [ ] `src/components/AssetTable.tsx` uses `assetPnL` instead of inline P&L computation
- [ ] `grep -rn "const pnl =" src/components/` returns no matches (inline P&L computations removed)
- [ ] `grep -rn "import.*currentValue" src/components/` returns no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- `currentValue` is referenced outside `src/lib/calculations.ts` after removing the imports (it shouldn't be — verify with `grep`).

## Maintenance notes

- All gold arithmetic now lives in `src/lib/calculations.ts`: `weightToOzt`, `fineOzt`, `currentValue`, `calculateSpotEurPerOz`, `assetPnL`, `portfolioPnL`. This is the single module to unit-test.
- If a new component needs P&L data, import from `calculations.ts`, not compute inline.
- The `portfolioPnL` function recalculates everything from scratch each call. For large portfolios (1000+ assets), this could be optimized with memoization, but that's premature for the current scale.