# Plan 010: Remove dead code

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/types.ts src/lib/storage.ts src/lib/api.ts src/components/ui/Card.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `728d33f`, 2026-06-12

## Why this matters

Four exports are defined but never imported anywhere in the codebase: `AppState` (types.ts), `updateAsset` (storage.ts), `CardDescription` (Card.tsx), and `getCachedMetalPrice` (api.ts). Dead code increases surface area for future confusion — someone might use `AppState` expecting it to match runtime state, or `getCachedMetalPrice` not realizing it's a one-line wrapper. Removing it reduces the cognitive load and eliminates false signals during search.

## Current state

`src/types.ts:23-27` — `AppState` is defined but never imported:
```typescript
export interface AppState {
  assets: Asset[]
  apiKey: string | null
  metalPrice: MetalPrice | null
}
```
The actual app state is held across separate `useState` hooks in `App.tsx`, not as a single `AppState` object.

`src/lib/storage.ts:31-34` — `updateAsset` is exported but never imported by any file:
```typescript
export function updateAsset(asset: Asset): void {
  const assets = getAssets().map((a) => (a.id === asset.id ? asset : a))
  setItem(ASSETS_KEY, assets)
}
```
There is no "edit asset" UI — this is scaffolding for a future feature.

`src/components/ui/Card.tsx:46-56` — `CardDescription` is defined and exported on line 66:
```typescript
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  ...
))
CardDescription.displayName = "CardDescription"
```
No component in the codebase imports `CardDescription`.

`src/lib/api.ts:38-40` — `getCachedMetalPrice` is a passthrough wrapper:
```typescript
export function getCachedMetalPrice(): MetalPrice | null {
  return getMetalPrice()
}
```
Imported in `App.tsx:4` — change the import to use `getMetalPrice` directly from `./lib/storage`, then remove this function.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/types.ts` — remove `AppState` interface
- `src/lib/storage.ts` — remove `updateAsset` export
- `src/components/ui/Card.tsx` — remove `CardDescription` definition and export
- `src/lib/api.ts` — remove `getCachedMetalPrice` function
- `src/App.tsx` — update import from `getCachedMetalPrice` to `getMetalPrice` from storage

**Out of scope**:
- `src/lib/calculations.ts` — the `fineOzt` and `weightToOzt` exports are used internally by `currentValue` in the same module. They remain.
- Any behavioral changes
- Adding or removing any other exports

## Git workflow

- Branch: `advisor/010-remove-dead-code`
- Commit message: `refactor: remove unused exports (AppState, updateAsset, CardDescription, getCachedMetalPrice)`
- One commit — all removals are independent, do them in any order
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Remove `AppState` from `src/types.ts`

Delete lines 23-27 (the entire `AppState` interface). The file should end at line 22 with the closing `}` of `MetalPrice`.

**Verify**: `grep -rn "AppState" src/` → no matches

### Step 2: Remove `updateAsset` from `src/lib/storage.ts`

Delete lines 31-34 (the entire `updateAsset` function). The `saveAsset` (line 25) and `deleteAsset` (line 36) functions remain — they are both used.

**Verify**: `grep -rn "updateAsset" src/` → no matches

### Step 3: Remove `CardDescription` from `src/components/ui/Card.tsx`

Delete lines 46-56 (the `CardDescription` definition) and remove `CardDescription` from the export on line 66. Change the export from:
```typescript
export { Card, CardHeader, CardTitle, CardDescription, CardContent }
```
to:
```typescript
export { Card, CardHeader, CardTitle, CardContent }
```

**Verify**: `grep -rn "CardDescription" src/` → no matches

### Step 4: Remove `getCachedMetalPrice` wrapper and update App import

In `src/lib/api.ts`, delete lines 38-40 (the `getCachedMetalPrice` function).

In `src/App.tsx`, change the import on line 4 from:
```typescript
import { fetchMetalPrice, getCachedMetalPrice } from "./lib/api"
```
to:
```typescript
import { fetchMetalPrice } from "./lib/api"
import { getMetalPrice } from "./lib/storage"
```

Then on line 13, change:
```typescript
const [metalPrice, setMetalPrice] = useState<MetalPrice | null>(() => getCachedMetalPrice())
```
to:
```typescript
const [metalPrice, setMetalPrice] = useState<MetalPrice | null>(() => getMetalPrice())
```

**Verify**: `grep -rn "getCachedMetalPrice" src/` → no matches

### Step 5: Final verification

**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

No test infrastructure exists. Manual verification:
1. `npm run dev` — app loads and works identically to before. All features (add asset, delete asset, dashboard display, table display, API price fetch) should work.
2. Verify the app's behavior is unchanged — dead code by definition has no callers, so removing it cannot change behavior.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -rn "AppState" src/` returns no matches
- [ ] `grep -rn "updateAsset" src/` returns no matches
- [ ] `grep -rn "CardDescription" src/` returns no matches
- [ ] `grep -rn "getCachedMetalPrice" src/` returns no matches
- [ ] `src/App.tsx` imports `getMetalPrice` from `./lib/storage` (not `getCachedMetalPrice` from `./lib/api`)
- [ ] `src/components/ui/Card.tsx` export does not include `CardDescription`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- Any of the four `grep` commands above returns matches after you believe you've removed all references — this means there's a usage the plan didn't account for.

## Maintenance notes

- If asset editing is added later, `updateAsset` will be re-introduced. That's fine — the function is trivial and recreating it takes 30 seconds. The dead export just shouldn't live in the codebase until then.
- The `CardDescription` component may be needed if the app ever adds a card with a description subtext. Recreate it from the shadcn/ui source when the time comes.
- The `getCachedMetalPrice` wrapper was a thin cache-abstraction layer. If a proper cache layer is ever added (e.g., TTL-based, with network-first strategy), a function with this name may return. For now, callers import `getMetalPrice` directly.