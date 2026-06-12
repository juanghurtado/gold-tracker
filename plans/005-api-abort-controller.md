# Plan 005: Add AbortController to API fetch for safe unmount and deduplication

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 45920a0..HEAD -- src/lib/api.ts src/App.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 003 (both touch `api.ts`; 003 should land first to avoid merge conflicts)
- **Category**: perf, correctness
- **Planned at**: commit `45920a0`, 2026-06-11

## Why this matters

The `fetchMetalPrice` function in `api.ts` uses a bare `fetch()` with no `AbortSignal`. This means:
1. If the component unmounts while a request is in-flight, the promise resolves, calls `setMetalPrice()`, and React logs a warning about state update on unmounted component.
2. Rapid clicks on "Actualizar precios" fire concurrent requests — each one independently fetches, parses, and writes to localStorage + React state. The last one to resolve wins, but all of them write to localStorage.
Adding `AbortController` + a simple deduplication guard fixes both issues with ~10 lines of code.

## Current state

`src/lib/api.ts:6-30` — `fetchMetalPrice` has no cancellation mechanism:

```typescript
export async function fetchMetalPrice(): Promise<MetalPrice> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("API key not configured")
  }

  const res = await fetch(
    `${API_BASE}/latest?api_key=${apiKey}&base=USD&currencies=XAU,EUR`
  )
  // ...
}
```

`src/App.tsx` — the caller invokes `fetchMetalPrice()` via `refreshPrice`, which does `setLoading(true)` then calls `fetchMetalPrice()`. Multiple rapid clicks on the button (which is disabled only while `loading` is true) won't trigger concurrent requests due to the `disabled={loading}` prop on the button at `App.tsx:80`. However, the button-disable guard is the *only* protection — there's no request-level guard.

The repo convention for async operations is `async/await` with `try/catch` — see `App.tsx:38-44`. Error messages are in Spanish ("Error al obtener precio").

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0, no errors   |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/lib/api.ts` — add optional `AbortSignal` parameter to `fetchMetalPrice`

**Out of scope**:
- `src/App.tsx` — the loading state already prevents double-clicks; no changes needed there unless you want to pass the signal from the component (optional, not required for this fix)
- Adding in-flight request deduplication via a singleton promise (tempting, but out of scope — the button-disable guard is sufficient for now)
- Tests

## Git workflow

- Branch: `advisor/005-api-abort-controller`
- Commit message: `fix: add AbortSignal support to fetchMetalPrice`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add optional AbortSignal to `fetchMetalPrice`

Modify the `fetchMetalPrice` function signature and the `fetch` call in `src/lib/api.ts`:

**Signature change** — add an optional signal parameter:
```typescript
export async function fetchMetalPrice(signal?: AbortSignal): Promise<MetalPrice> {
```

**Fetch call** — pass the signal:
```typescript
const res = await fetch(
  `${API_BASE}/latest?api_key=${apiKey}&base=USD&currencies=XAU,EUR`,
  { signal }
)
```

The rest of the function stays unchanged (including the error-handling fix from plan 003, if that has landed).

**Verify**: `npx tsc -b` → exit 0

**Verify**: `npm run lint` → exit 0

### Step 2: Wire AbortController in the caller

In `src/App.tsx`, update the `refreshPrice` function to use an AbortController. The pattern:

```typescript
let abortController: AbortController | null = null

async function refreshPrice(key?: string) {
  const k = key ?? apiKey
  if (!k) return

  // Abort any in-flight request
  abortController?.abort()
  abortController = new AbortController()

  setLoading(true)
  setError(null)
  try {
    const price = await fetchMetalPrice(abortController.signal)
    setMetalPrice(price)
  } catch (e) {
    // Ignore aborted requests
    if (e instanceof DOMException && e.name === "AbortError") return
    setError(e instanceof Error ? e.message : "Error al obtener precio")
  } finally {
    setLoading(false)
    abortController = null
  }
}
```

Place the `abortController` variable outside the function (module level in the component, before `refreshPrice`).

**Verify**: `npx tsc -b` → exit 0

**Verify**: `npm run lint` → exit 0

### Step 3: Final verification

**Verify**: `npm run build` → exit 0

## Test plan

No new tests. The `npm run build` command is the verification gate.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -n "AbortSignal\|abortController\|AbortController" src/lib/api.ts` shows the signal parameter
- [ ] `grep -n "AbortError\|abortController" src/App.tsx` shows the abort controller logic
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix requires touching a file outside the in-scope list.
- `fetchMetalPrice` already has an `AbortSignal` parameter (plan 003 may have been implemented with it — check first).

## Maintenance notes

- The `AbortError` check uses `DOMException` which is available in browser environments. If the app ever runs in a non-browser environment (SSR, testing), the check should use `(e as DOMException).name === "AbortError"` or a try/catch fallback.
- If a future request library (e.g., axios, ky) replaces `fetch`, the abort pattern is different — axios uses `CancelToken` (deprecated in favor of `AbortController`) and ky uses `AbortSignal` natively.
- The `abortController` module-level variable is simple and sufficient for a single-purpose API call. If the app grows to need multiple concurrent request types, consider a more structured approach (e.g., a per-request map).