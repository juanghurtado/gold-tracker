# Plan 003: Fix API error handling for non-HTTP error responses

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 45920a0..HEAD -- src/lib/api.ts src/types.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `45920a0`, 2026-06-11

## Why this matters

When the metalpriceapi.com endpoint returns an error (invalid API key, rate limited, server error), the API returns HTTP 200 with a JSON body like `{"success": false, "error": "invalid_api_key"}` — but the current code only checks `res.ok` (HTTP status), not the JSON body. When this happens, `data.rates` is undefined, and the fallback operators `?` (`1 / data.rates.XAU : 0`) and `||` (`data.rates.EUR || 0`) silently produce `xauUsd: 0, eurUsd: 0`. The user sees €0.00 values with no error, which looks like the app is broken or all their gold is worthless.

## Current state

`src/lib/api.ts:6-30` currently reads:

```typescript
export async function fetchMetalPrice(): Promise<MetalPrice> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("API key not configured")
  }

  const res = await fetch(
    `${API_BASE}/latest?api_key=${apiKey}&base=USD&currencies=XAU,EUR`
  )

  if (!res.ok) {
    throw new Error(`Metal price API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  const price: MetalPrice = {
    xauUsd: data.rates.XAU ? 1 / data.rates.XAU : 0,
    eurUsd: data.rates.EUR || 0,
    timestamp: Date.now(),
  }

  saveMetalPrice(price)
  return price
}
```

The `MetalPrice` type in `src/types.ts:17-21`:
```typescript
export interface MetalPrice {
  xauUsd: number
  eurUsd: number
  timestamp: number
}
```

The metalpriceapi.com `/latest` endpoint returns:
- **Success**: HTTP 200, `{"success": true, "rates": {"XAU": 0.00045, "EUR": 0.85, ...}}`
- **Error**: HTTP 200, `{"success": false, "error": "invalid_api_key"}` (note: `rates` is absent)

The current code does not check `data.success` before parsing `data.rates`.

The repo convention for error handling: throw `Error` with a message string, catch in caller and display as-is (see `App.tsx:41-42`: `setError(e instanceof Error ? e.message : "Error al obtener precio")`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0, no errors   |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/lib/api.ts` — add response body validation
- `src/types.ts` — optionally add an `ApiResponse` type if it helps clarity (not required)

**Out of scope**:
- `src/App.tsx` — the error display logic is fine, don't touch
- Adding tests (no test infrastructure exists yet)
- Retry logic, caching strategies, or any other API behavior change

## Git workflow

- Branch: `advisor/003-fix-api-error-handling`
- Commit message: `fix: validate API response body for non-HTTP error responses`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add response body validation in `fetchMetalPrice`

After `const data = await res.json()` and before constructing the price, add a validation check:

```typescript
const data = await res.json()

if (!data.success || !data.rates?.XAU || !data.rates?.EUR) {
  const errorMsg = data.error || "Metal price API returned an unexpected response"
  throw new Error(`Metal price API error: ${errorMsg}`)
}
```

This catches:
- Error responses (`{success: false, error: "..."}`)
- Malformed responses (missing `rates` or missing currency keys)
- Zero-rate responses (would produce division by zero or zero prices)

The `throw` will be caught by the existing `try/catch` in `App.tsx:41-42`, which already displays the error message to the user via `setError`.

**Verify**: `npx tsc -b` → exit 0

**Verify**: `npm run lint` → exit 0

### Step 2: Verify build

**Verify**: `npm run build` → exit 0

## Test plan

No new tests. If you want to verify the logic manually, check that the metalpriceapi.com documentation matches the response shape used here. The build command (`npm run build`) is the verification gate.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/lib/api.ts` contains a check for `data.success !== false` (or equivalent) before accessing `data.rates`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The API response format documented by metalpriceapi.com has changed (check their current docs if in doubt).
- The fix requires touching a file outside the in-scope list.

## Maintenance notes

- If a future change adds a different API endpoint, replicate this `success` + `rates` validation pattern.
- The `data.error` field is optional in the API response — the `||` fallback is the correct defensive approach.
- If the API response format changes (e.g., moving to HTTP 4xx for errors), the `if (!res.ok)` check will catch it, but the `data.success` check is the belt-and-suspenders for the current behavior.