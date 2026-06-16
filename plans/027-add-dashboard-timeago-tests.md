# Plan 027: Add tests for Dashboard `timeAgo` seconds and minutes branches

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ff6a58a..HEAD -- src/components/Dashboard.test.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ff6a58a`, 2026-06-16
- **Issue**: (none)

## Why this matters

The `timeAgo` helper function in `Dashboard.tsx` has four branches (seconds < 60, minutes < 60, hours, and the fallback), but only the "hours" branch is covered by existing tests. The other two branches — "Actualizado hace unos segundos" and "Actualizado hace X min" — are untested. While the function is simple, untested branches hide edge-case bugs (e.g. negative timestamps, NaN). Adding these tests closes a coverage gap and protects against regressions.

## Current state

- `src/components/Dashboard.tsx` — `timeAgo` function at lines 5-12

```typescript
// Dashboard.tsx:5-12
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "Actualizado hace unos segundos"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Actualizado hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `Actualizado hace ${hours}h`
}
```

- `src/components/Dashboard.test.tsx` — existing tests, 55 lines

Existing tests use `highPrice: MetalPrice = { xauUsd: 3000, eurPerUsd: 0.95, timestamp: 1 }`. With `timestamp: 1`, `Date.now() - 1` yields a large number, always hitting the "hours" branch (or beyond). The "seconds" and "minutes" branches are never exercised.

The `timeAgo` function is used in the Dashboard to display the staleness indicator text:

```typescript
// Dashboard.tsx:65-66
{timeAgo(metalPrice.timestamp)}
```

The `timeAgo` function is not exported — it's a module-private helper. Tests must exercise it indirectly by rendering `Dashboard` with appropriate `timestamp` values.

Repo conventions (from `Dashboard.test.tsx`):
- Uses `vitest` (`describe`, `it`, `expect`)
- Uses `@testing-library/react` (`render`, `screen`)
- Uses `toLocaleString("es-ES", ...)` formatting — tests match locale-specific output
- Imports are: `import { describe, it, expect } from "vitest"` and `import { render, screen } from "@testing-library/react"`

The Dashboard renders the time string inside a `<p className="text-xs text-muted-foreground">` element that also contains the spot price. So the test can search for text content containing "Actualizado hace".

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `npm test`               | 85+ tests pass      |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |
| Coverage  | `npx vitest run --coverage` | Dashboard.tsx lines 7-9 covered |

## Scope

**In scope** (the only files you should modify):
- `src/components/Dashboard.test.tsx` — add new test cases

**Out of scope** (do NOT touch, even though they look related):
- `src/components/Dashboard.tsx` — no production code changes
- Any other test files
- `src/lib/calculations.ts` or its tests

## Git workflow

- Branch: `advisor/027-add-dashboard-timeago-tests`
- Commit style: `test: add Dashboard timeAgo coverage for seconds and minutes branches`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add the `afterAll` or use `vi.useFakeTimers` approach

The `timeAgo` function uses `Date.now()`, so the tests need control over the current time to produce predictable output. Rather than mocking `Date.now()` globally (which could affect other tests), use `vi.useFakeTimers()` and `vi.setSystemTime()` locally.

In `src/components/Dashboard.test.tsx`, add an import:

```typescript
import { afterEach, vi } from "vitest"
```

Then add a `beforeEach` / `afterEach` to set a fixed system time for the timeAgo tests:

```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
})

afterEach(() => {
  vi.useRealTimers()
})
```

These go inside a new `describe("timeAgo")` block so they don't affect the existing tests.

**Verify**: `npm test` → all existing tests still pass (the existing tests don't use timeAgo in a way that fails with fake timers).

### Step 2: Add the "seconds" branch test

Inside a `describe("timeAgo")` block, add:

```typescript
it('shows "unos segundos" when price updated less than 60 seconds ago', () => {
  const recentPrice: MetalPrice = { ...highPrice, timestamp: Date.now() - 30 * 1000 }
  render(<Dashboard assets={[pureAsset]} metalPrice={recentPrice} />)
  expect(screen.getByText(/Actualizado hace unos segundos/)).toBeInTheDocument()
})
```

This sets `timestamp` to 30 seconds before the mocked `Date.now()`, which hits the `seconds < 60` branch.

**Verify**: `npm test` → passes, the "seconds" test runs.

### Step 3: Add the "minutes" branch test

```typescript
it('shows "X min" when price updated less than 60 minutes ago', () => {
  const recentPrice: MetalPrice = { ...highPrice, timestamp: Date.now() - 5 * 60 * 1000 }
  render(<Dashboard assets={[pureAsset]} metalPrice={recentPrice} />)
  expect(screen.getByText(/Actualizado hace 5 min/)).toBeInTheDocument()
})
```

This sets `timestamp` to 5 minutes before the mocked `Date.now()`, which hits the `minutes < 60` branch.

**Verify**: `npm test` → passes.

### Step 4: Add the "hours" branch test (confirm existing behavior)

```typescript
it('shows "Xh" when price updated 2 hours ago', () => {
  const oldPrice: MetalPrice = { ...highPrice, timestamp: Date.now() - 2 * 60 * 60 * 1000 }
  render(<Dashboard assets={[pureAsset]} metalPrice={oldPrice} />)
  expect(screen.getByText(/Actualizado hace 2h/)).toBeInTheDocument()
})
```

This documents the existing behavior (matching what the original test already exercised with `timestamp: 1`).

**Verify**: `npm test` → passes.

### Step 5: Run coverage to confirm improvement

`npx vitest run --coverage` → Check that `Dashboard.tsx` line coverage for lines 7-9 now shows as covered.

### Step 6: Lint and build

`npm run lint` → exit 0. `npm run build` → exit 0.

## Test plan

New test cases in `src/components/Dashboard.test.tsx`:

| Test | Branch | Input |
|------|--------|-------|
| Shows "unos segundos" when <60s | `seconds < 60` | timestamp = now - 30s |
| Shows "X min" when <60min | `minutes < 60` | timestamp = now - 5min |
| Shows "Xh" when >=60min | fallback (hours) | timestamp = now - 2h |

All use `vi.useFakeTimers()` with a fixed system time for deterministic output. The `describe("timeAgo")` block wraps these tests so they don't interfere with existing tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0; Dashboard tests include 3+ new test cases for `timeAgo` branches
- [ ] `npx vitest run --coverage` shows `Dashboard.tsx` lines 7-9 as covered
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] No files outside `src/components/Dashboard.test.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `timeAgo` function has been modified or removed since this plan was written.
- `vi.useFakeTimers()` causes existing tests to fail — in that case, move the `beforeEach`/`afterEach` to only the new `describe` block (the existing tests don't use `realTimers` explicitly, but `afterEach` restoring real timers should keep them isolated).
- The `Dashboard` component's rendering of timeAgo has changed (e.g., moved to a different element or class).

## Maintenance notes

- If `timeAgo` is extracted to `calculations.ts` or `utils.ts`, move these tests too.
- If `timeAgo` logic changes (e.g., "justo ahora" instead of "unos segundos"), update the test assertions to match.
- The use of `vi.useFakeTimers()` is scoped to a `describe` block — this pattern isolates timer-dependent tests from the rest.