# Plan 006: Fix EUR spot price calculation — multiply instead of divide

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/lib/api.ts src/types.ts`
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

The EUR spot price calculation in `api.ts` is mathematically wrong. The API returns `rates.EUR` as "how many EUR per 1 USD" (e.g., 0.92), but the code divides `xauUsd` by this value instead of multiplying. At EUR/USD = 1.10 with gold at $2000/oz, the app shows €2200/oz instead of the correct €1818/oz — a ~21% error across all portfolio valuations, P&L figures, and percentages.

## Current state

`src/lib/api.ts:28-31` — the `MetalPrice` object is constructed:
```typescript
const price: MetalPrice = {
  xauUsd: data.rates.XAU ? 1 / data.rates.XAU : 0,
  eurUsd: data.rates.EUR || 0,
  timestamp: Date.now(),
}
```

`data.rates.EUR` = EUR per USD (e.g. 0.92). The field `eurUsd` stores this as-is, but the name `eurUsd` is ambiguous — it sounds like "USD per EUR" (which would be `1 / rates.EUR`).

`src/lib/api.ts:42-44` — the conversion function:
```typescript
export function calculateSpotEurPerOz(price: MetalPrice): number {
  return price.xauUsd / price.eurUsd
}
```

Division is wrong. `xauUsd` is USD/oz. `eurUsd` is EUR/USD (currently). The correct EUR/oz = (USD/oz) * (EUR/USD) = `xauUsd * eurUsd`.

`src/types.ts:17-21` — the `MetalPrice` interface:
```typescript
export interface MetalPrice {
  xauUsd: number
  eurUsd: number
  timestamp: number
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/lib/api.ts` — change `/` to `*` in `calculateSpotEurPerOz`
- `src/types.ts` — rename `eurUsd` to `eurPerUsd` to clarify semantics

**Out of scope**:
- Any other files — the `calculateSpotEurPerOz` callers (`Dashboard.tsx`, `AssetTable.tsx`) reference it by function name and don't need changes since the function signature stays the same.
- The `xauUsd` field — its semantics (USD per oz) are correct, just rename is not needed.

## Git workflow

- Branch: `advisor/006-fix-eur-spot-calculation`
- Commit message: `fix: correct EUR spot price calculation (multiply, not divide)`
- One commit — this is a two-line change
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Rename `eurUsd` to `eurPerUsd` in `MetalPrice` interface

In `src/types.ts`, change line 19 from:
```typescript
  eurUsd: number
```
to:
```typescript
  eurPerUsd: number
```

This makes the semantics explicit — the value is "EUR per USD", matching what the API returns.

**Verify**: `grep -n "eurUsd" src/types.ts` → only reference should now say `eurPerUsd`

### Step 2: Update the field name in `api.ts`

In `src/lib/api.ts`, change line 30 from:
```typescript
    eurUsd: data.rates.EUR || 0,
```
to:
```typescript
    eurPerUsd: data.rates.EUR || 0,
```

**Verify**: `grep -rn "eurUsd" src/` → still has matches in `Dashboard.tsx` and `AssetTable.tsx` (they use `eurPerUsd` via the `MetalPrice` type — since those files only access the field via `calculateSpotEurPerOz`, they don't reference `eurUsd`/`eurPerUsd` directly). Confirm: `grep -rn "eurUsd\|eurPerUsd" src/` shows only the `api.ts` line 30 and `types.ts` line 19.

### Step 3: Fix the calculation

In `src/lib/api.ts`, change line 43 from:
```typescript
  return price.xauUsd / price.eurUsd
```
to:
```typescript
  return price.xauUsd * price.eurPerUsd
```

**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

### Step 4: Verify no stale references

**Verify**: `grep -rn "eurUsd" src/` → returns no matches (all occurrences should be `eurPerUsd`). If any remain outside the files listed in "In scope", that's a STOP condition.

## Test plan

No automated test infrastructure exists in this project. After this change, verify manually:
1. If you have a MetalPriceApi key, run `npm run dev` and check that the spot price shown in the Dashboard card is roughly `XAU/USD ÷ EUR/USD` (e.g., if XAU=$2000 and EUR/USD=1.10, spot should be ~€1818/oz).
2. If you don't have a key, verify the arithmetic: open browser console and run `(2000 * 0.92)` should give 1840, the correct EUR/oz for gold at $2000 when 1 USD = 0.92 EUR.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -rn "eurUsd" src/` returns no matches
- [ ] `grep -rn "eurPerUsd" src/` matches `src/lib/api.ts:30` and `src/types.ts:19`
- [ ] `calculateSpotEurPerOz` in `src/lib/api.ts` uses `*` not `/`
- [ ] No files outside `src/lib/api.ts` and `src/types.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- `grep` reveals that `eurUsd` is referenced in other files that this plan didn't account for.

## Maintenance notes

- The name `eurPerUsd` is unambiguous: the value is "how many EUR you get for 1 USD". Any future developer reading `eurPerUsd` will know to multiply (EUR/oz = USD/oz × EUR/USD).
- If the API provider ever changes the base currency or response format, the conversion logic in `api.ts` must be revisited.
- The `xauUsd` field follows the same naming convention: "how many USD per 1 XAU".