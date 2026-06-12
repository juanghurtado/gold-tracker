# Plan 011: Move calculateSpotEurPerOz from api.ts to calculations.ts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/lib/api.ts src/lib/calculations.ts src/components/Dashboard.tsx src/components/AssetTable.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 006 (fix EUR spot price calculation — the function being moved was fixed in that plan)
- **Category**: tech-debt
- **Planned at**: commit `728d33f`, 2026-06-12

## Why this matters

`calculateSpotEurPerOz` is a pure arithmetic function (`xauUsd * eurPerUsd`) that lives in `src/lib/api.ts` — a module whose responsibility is network I/O. The two consumers (`Dashboard.tsx`, `AssetTable.tsx`) import from `api.ts` just to divide two numbers. This mixes concerns: if anyone adds caching or validation logic to `api.ts`, they must step around this calculation. Moving it to `calculations.ts`, where `currentValue` and `fineOzt` already live, keeps arithmetic with arithmetic and I/O with I/O.

## Current state

`src/lib/api.ts:42-44` — the function in the wrong module:
```typescript
export function calculateSpotEurPerOz(price: MetalPrice): number {
  return price.xauUsd * price.eurPerUsd
}
```

`src/components/Dashboard.tsx:2` — imports from api.ts for a calculation:
```typescript
import { calculateSpotEurPerOz } from "../lib/api"
```

`src/components/AssetTable.tsx:2` — same import:
```typescript
import { calculateSpotEurPerOz } from "../lib/api"
```

`src/lib/calculations.ts:1-13` — the correct home module, which already exports `currentValue` (used by both Dashboard and AssetTable):
```typescript
import type { Asset } from "../types"

export function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

export function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

export function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/lib/calculations.ts` — add `calculateSpotEurPerOz` function
- `src/lib/api.ts` — remove `calculateSpotEurPerOz` function and its import of `MetalPrice` if no longer needed
- `src/components/Dashboard.tsx` — update import
- `src/components/AssetTable.tsx` — update import

**Out of scope**:
- Any behavioral changes to the function body
- `src/lib/api.ts` — the `getCachedMetalPrice` function remains (it's being removed in plan 010, but that's independent)
- Any other files

## Git workflow

- Branch: `advisor/011-move-calculation`
- Commit message: `refactor: move calculateSpotEurPerOz from api.ts to calculations.ts`
- One commit
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add the function to calculations.ts

In `src/lib/calculations.ts`, add the `MetalPrice` import and the function. The file is only 13 lines — append after the existing `currentValue` function. The final content should be:

```typescript
import type { Asset, MetalPrice } from "../types"

export function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

export function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

export function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}

export function calculateSpotEurPerOz(price: MetalPrice): number {
  return price.xauUsd * price.eurPerUsd
}
```

Note: this assumes plan 006 has been executed (the field is `eurPerUsd`, not `eurUsd`, and the operator is `*`, not `/`). If plan 006 has NOT been executed yet, use the current field name and operator from the code at the time of execution.

**Verify**: `npx tsc -b` → exit 0

### Step 2: Remove the function from api.ts

In `src/lib/api.ts`, delete the `calculateSpotEurPerOz` function (lines 42-44). Also check if the import of `MetalPrice` on line 1 is still needed — it's used by `fetchMetalPrice` return type, so it should remain. Only `calculateSpotEurPerOz` is removed.

**Verify**: `grep -rn "calculateSpotEurPerOz" src/lib/api.ts` → no matches

### Step 3: Update Dashboard import

In `src/components/Dashboard.tsx`, change line 2 from:
```typescript
import { calculateSpotEurPerOz } from "../lib/api"
```
to:
```typescript
import { calculateSpotEurPerOz } from "../lib/calculations"
```

**Verify**: `npx tsc -b` → exit 0

### Step 4: Update AssetTable import

In `src/components/AssetTable.tsx`, change line 2 from:
```typescript
import { calculateSpotEurPerOz } from "../lib/api"
```
to:
```typescript
import { calculateSpotEurPerOz } from "../lib/calculations"
```

**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

**Verify no stale imports**: `grep -rn 'from "../lib/api"' src/components/Dashboard.tsx src/components/AssetTable.tsx` — should return no matches

## Test plan

No test infrastructure exists. Manual verification:
1. `npm run dev` — app loads and functions identically: Dashboard shows correct asset count, cost, current value, P&L. Table shows the same per-row. Spot price displays correctly.
2. The behavior is identical since the function code is unchanged.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -rn "calculateSpotEurPerOz" src/lib/api.ts` returns no matches
- [ ] `grep -rn "calculateSpotEurPerOz" src/lib/calculations.ts` returns a match on the function definition
- [ ] `src/components/Dashboard.tsx` imports `calculateSpotEurPerOz` from `../lib/calculations`
- [ ] `src/components/AssetTable.tsx` imports `calculateSpotEurPerOz` from `../lib/calculations`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- `calculateSpotEurPerOz` is imported somewhere else that this plan didn't identify.

## Maintenance notes

- All gold arithmetic functions now live in `src/lib/calculations.ts`. Future calculation functions (e.g., `portfolioPnL`, `percentageReturn`) should be added there.
- If tests are ever added, `calculations.ts` is the most testable module — pure functions with no side effects.
- The `metalPrice` parameter type (`MetalPrice`) is now imported in `calculations.ts`, which is fine since it's a pure data type.