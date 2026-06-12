# Plan 002: Fix App.tsx lint errors (set-state-in-effect, hoisting, missing dep)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 45920a0..HEAD -- src/App.tsx`
> If App.tsx changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx, correctness
- **Planned at**: commit `45920a0`, 2026-06-11

## Why this matters

`npm run lint` produces 3 errors and 1 warning, all in `src/App.tsx`. Two are correctness-adjacent (setState in effect body causes unnecessary cascade renders; `refreshPrice` is called before its `const` declaration, which is a hoisting illusion that works only by timing accident). One is a React Compiler incompatibility warning. One is a missing dependency warning. These are the only lint violations in the entire codebase — fixing them brings lint to zero and removes real (if minor) runtime risks.

## Current state

`src/App.tsx:20-46` currently reads:

```tsx
useEffect(() => {
  setAssets(getAssets())           // line 21 — set-state-in-effect error
  const key = getApiKey()
  setApiKeyState(key)
  const cached = getCachedMetalPrice()
  if (cached) {
    setMetalPrice(cached)
  }
  if (key) {
    refreshPrice(key)              // line 29 — hoisting / immutability error
  }
}, [])                              // line 31 — missing dep warning

const refreshPrice = useCallback(async (key?: string) => {
  const k = key ?? apiKey
  if (!k) return
  setLoading(true)
  setError(null)
  try {
    const price = await fetchMetalPrice()
    setMetalPrice(price)
  } catch (e) {
    setError(e instanceof Error ? e.message : "Error al obtener precio")
  } finally {
    setLoading(false)
  }
}, [apiKey])                        // line 46 — preserve-manual-memoization error
```

The lint errors are:
1. **Line 21** (`react-hooks/set-state-in-effect`): Calling `setAssets`, `setApiKeyState`, `setMetalPrice` synchronously in the effect body.
2. **Line 29** (`react-hooks/immutability`): `refreshPrice` is a `const useCallback` — it's in the TDZ when the effect body runs, though it works at runtime because the effect executes after render.
3. **Line 31** (`react-hooks/exhaustive-deps`): `refreshPrice` is used but not in the dependency array.
4. **Line 33** (`react-hooks/preserve-manual-memoization`): React Compiler can't preserve the manual `useCallback` memoization.

The repo convention is `useState` + `useEffect` + `useCallback` in a flat component — see `src/App.tsx` for the pattern. Error messages are in Spanish ("Error al obtener precio").

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0, no errors   |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/App.tsx`

**Out of scope**:
- Any other file
- Changing the app's behavior (the UI should look and work identically)
- Adding tests

## Git workflow

- Branch: `advisor/002-fix-app-lint-errors`
- Commit message: `fix: resolve lint errors in App.tsx (set-state-in-effect, hoisting, missing dep)`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Restructure the effect to avoid set-state-in-effect and hoisting

Replace the `useEffect` + separate `useCallback` pattern with **initial state from localStorage** (no effect at all for the initial load). The golden rule: if data comes from an external store synchronously (localStorage), initialize state from it directly rather than via an effect.

Change the state initializers at `App.tsx:12-14` from:
```tsx
const [assets, setAssets] = useState<Asset[]>([])
const [metalPrice, setMetalPrice] = useState<MetalPrice | null>(null)
const [apiKey, setApiKeyState] = useState<string | null>(null)
```

To:
```tsx
const [assets, setAssets] = useState<Asset[]>(() => getAssets())
const [metalPrice, setMetalPrice] = useState<MetalPrice | null>(() => getCachedMetalPrice())
const [apiKey, setApiKeyState] = useState<string | null>(() => getApiKey())
```

Uses lazy initializer functions — React calls them once on mount, no effect needed.

**Verify**: `npx tsc -b` → exit 0

### Step 2: Remove the useEffect and trigger first price fetch on mount differently

Now that state is initialized from localStorage, the `useEffect` block (lines 20-31) is only doing one thing that can't be expressed in initializers: the initial `refreshPrice(key)` call when an API key exists.

Delete the entire `useEffect` block (lines 20-31). To keep the initial price fetch, use a different pattern: a `useEffect` that only calls `refreshPrice` (without the state-sync logic). But `refreshPrice` still has the hoisting problem.

Move `refreshPrice` ABOVE the effect (or better, don't use `useCallback` — remove the wrapper). Since there's no performance issue with a small function declared in the component body, replace the `useCallback` with a plain async function:

```tsx
async function refreshPrice(key?: string) {
  const k = key ?? apiKey
  if (!k) return
  setLoading(true)
  setError(null)
  try {
    const price = await fetchMetalPrice()
    setMetalPrice(price)
  } catch (e) {
    setError(e instanceof Error ? e.message : "Error al obtener precio")
  } finally {
    setLoading(false)
  }
}
```

Then put a single `useEffect` ABOVE it or use it from a different trigger. The cleanest approach: since the initializers already read the cached price, trigger the live price refresh from a `useEffect` that calls `refreshPrice` only when the API key is available:

```tsx
useEffect(() => {
  if (apiKey) {
    refreshPrice(apiKey)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [apiKey])
```

This effect declares `apiKey` as a dependency (it has to, since `refreshPrice` captures it via closure but is no longer a `useCallback`). The `refreshPrice` function is declared above the effect so there's no hoisting issue.

Alternatively, to keep `refreshPrice` as a `useCallback` for stability, declare it first, then reference it in the effect. Either approach works — prefer plain function for simplicity since there are no child components that would benefit from referential stability.

**Verify**: `npm run lint` → exit 0 (zero errors, zero warnings)

**Verify**: `npm run build` → exit 0

### Step 3: Verify the full app still works (manual check)

Since there are no tests, verify manually:
- Build succeeds: `npm run build` → exit 0
- Lint is clean: `npm run lint` → exit 0
- Typecheck passes: `npx tsc -b` → exit 0

## Test plan

No new tests. The existing `npm run build` command serves as the integration gate.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0 with zero errors
- [ ] `npx tsc -b` exits 0
- [ ] `npm run build` exits 0
- [ ] No `set-state-in-effect` or `immutability` or `preserve-manual-memoization` errors remain
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix requires touching a file outside `src/App.tsx`.
- The app fails to load or crashes after the changes (test by running `npm run build` and checking the output).

## Maintenance notes

- The `eslint-disable-next-line react-hooks/exhaustive-deps` comment should be a last resort. In this case it's justified because `refreshPrice` is a stable plain function that references `apiKey` via the closure, and `apiKey` is already in the dependency array.
- If the component grows complex enough to need `useCallback`, reintroduce it — but for now, plain async functions are simpler and lint-clean.