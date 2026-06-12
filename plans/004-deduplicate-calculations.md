# Plan 004: Deduplicate gold calculation functions into shared module

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 45920a0..HEAD -- src/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `45920a0`, 2026-06-11

## Why this matters

Three identical calculation functions (`weightToOzt`, `fineOzt`, `currentValue`) exist in both `Dashboard.tsx` and `AssetTable.tsx`. This is a DRY violation — any change to the calculation logic (e.g., fixing the troy ounce conversion constant, adding a different unit, changing the purity formula) must be made in two places. Extracting them to a shared module prevents future drift and makes the calculations independently testable.

## Current state

`src/components/Dashboard.tsx:5-15`:
```typescript
function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}
```

`src/components/AssetTable.tsx:5-15` — **identical code**:
```typescript
function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}
```

The repo convention for shared utility code is `src/lib/` — see `src/lib/utils.ts` (the `cn` function) and `src/lib/api.ts` (API logic). The `cn` function at `src/lib/utils.ts:4-5` shows the pattern:
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0, no errors   |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/lib/calculations.ts` — create this file
- `src/components/Dashboard.tsx` — remove the three local functions, import from shared
- `src/components/AssetTable.tsx` — remove the three local functions, import from shared

**Out of scope**:
- `src/lib/api.ts` — `calculateSpotEurPerOz` lives there and is fine for now; moving it is a separate concern
- `src/lib/utils.ts` — only `cn`, leave alone
- `src/types.ts` — no changes needed
- `src/App.tsx` — no changes
- Any other component or module

## Git workflow

- Branch: `advisor/004-deduplicate-calculations`
- Commit message: `refactor: extract gold calculations to shared src/lib/calculations.ts`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Create `src/lib/calculations.ts`

Create the file with the three exported functions:

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

Match the repo conventions:
- `import type` for type-only imports (as in `storage.ts:1`, `api.ts:1`)
- No comments
- Same function signatures (pure functions, no side effects)

**Verify**: `npx tsc -b` → exit 0

**Verify**: `npm run lint` → exit 0

### Step 2: Update `Dashboard.tsx` to import from shared module

In `src/components/Dashboard.tsx`:
1. **Remove** lines 5-15 (the three local function declarations: `weightToOzt`, `fineOzt`, `currentValue`)
2. **Add** an import at the top of the file:
   ```typescript
   import { currentValue } from "../lib/calculations"
   ```
   (Only `currentValue` is used in Dashboard. `fineOzt` and `weightToOzt` are called only by `currentValue` internally in `calculations.ts`, so they don't need to be imported here.)

**Verify**: `npx tsc -b` → exit 0

**Verify**: `npm run lint` → exit 0

### Step 3: Update `AssetTable.tsx` to import from shared module

In `src/components/AssetTable.tsx`:
1. **Remove** lines 5-15 (the three local function declarations)
2. **Add** an import at the top of the file:
   ```typescript
   import { currentValue } from "../lib/calculations"
   ```

**Verify**: `npx tsc -b` → exit 0

**Verify**: `npm run lint` → exit 0

### Step 4: Verify no duplicates remain

**Verify**: `grep -n "function weightToOzt\|function fineOzt" src/components/Dashboard.tsx src/components/AssetTable.tsx` → no matches

**Verify**: `npm run build` → exit 0

## Test plan

No new tests required. The build verification (`npm run build`) ensures imports resolve correctly and types match. If tests are added later (plan 006), `src/lib/calculations.ts` is a natural first candidate for unit tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -n "function weightToOzt\|function fineOzt\|function currentValue" src/components/Dashboard.tsx src/components/AssetTable.tsx` returns no matches
- [ ] `src/lib/calculations.ts` exists and exports `weightToOzt`, `fineOzt`, `currentValue`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The function signatures differ between the two components (one may have been updated independently — if so, reconcile and report the difference).
- The fix requires touching a file outside the in-scope list.

## Maintenance notes

- If the troy ounce conversion constant (31.1035) needs to be more precise or vary by context, define it as a named constant in `calculations.ts`.
- If `calculateSpotEurPerOz` in `api.ts:36-38` is also calculation logic, consider moving it here in a future plan — but not now, since it would create an unnecessary dependency on `api.ts`.
- This is the file where new calculation functions (e.g., portfolio weight, average cost per gram) should be added in the future.