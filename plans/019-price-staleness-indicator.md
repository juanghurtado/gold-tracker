# Plan 019: Show price staleness indicator in Dashboard

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- src/components/Dashboard.tsx src/types.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

The `MetalPrice` object stores a `timestamp` (from `Date.now()` when the price was fetched), but it's never displayed. Users have no way to tell how fresh the current price is — stale data from a previous session looks identical to a just-fetched price. Showing "updated X min ago" gives users confidence in the data.

## Current state

`src/types.ts:17-21` — the `MetalPrice` type already has a `timestamp` field:
```typescript
export interface MetalPrice {
  xauUsd: number
  eurPerUsd: number
  timestamp: number
}
```

The timestamp is set in `src/lib/api.ts:31`:
```typescript
timestamp: Date.now(),
```

It's stored and retrieved via `saveMetalPrice` / `getMetalPrice` in `storage.ts`.

`src/components/Dashboard.tsx` currently shows spot price (lines 50-58) but not the timestamp:
```typescript
{metalPrice && (
  <p className="text-xs text-muted-foreground">
    Spot: {spotEurPerOz.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    })}{" "}
    / oz
  </p>
)}
```

**Repo convention**: Dashboard cards display secondary metadata in `<p className="text-xs text-muted-foreground">` (see `Dashboard.tsx:51-58`). Timestamps are formatted with locale `"es-ES"` — the rest of the app uses this locale for currency and date formatting (see `Dashboard.tsx:30-33`, `AssetTable.tsx:70-73`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Test      | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/components/Dashboard.tsx` — add staleness text

**Out of scope** (do NOT touch):
- No changes to `types.ts` or `storage.ts` — the timestamp field already exists
- No changes to `App.tsx` — the timestamp is already passed through `metalPrice` prop
- No adding a `timeAgo` utility function — inline the small calculation in the component
- No auto-refresh or polling — that's a separate feature

## Steps

### Step 1: Add a helper to compute "time ago" string

At the top of `src/components/Dashboard.tsx` (after the imports, before the `Dashboard` function), add a small helper function:

```typescript
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "Actualizado hace unos segundos"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Actualizado hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `Actualizado hace ${hours}h`
}
```

This follows the app's Spanish locale convention (matching the rest of the UI strings).

### Step 2: Show staleness next to the spot price

In `src/components/Dashboard.tsx`, update the spot price display block (around lines 50-58) to include the staleness. Change:

```typescript
{metalPrice && (
  <p className="text-xs text-muted-foreground">
    Spot: {spotEurPerOz.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    })}{" "}
    / oz
  </p>
)}
```

to:

```typescript
{metalPrice && (
  <p className="text-xs text-muted-foreground">
    Spot: {spotEurPerOz.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    })}{" "}
    / oz · {timeAgo(metalPrice.timestamp)}
  </p>
)}
```

Note the `·` (middle dot) separator — matches the separator used in `AssetTable.tsx:57` (`" · "`).

**Verify**: `grep -n "timeAgo" src/components/Dashboard.tsx` → shows the function definition and the usage line.

### Step 3: Verify

**Verify**: `npx tsc -b` → exit 0 (especially check that `metalPrice.timestamp` is accessed safely — it's inside an `{metalPrice && ...}` guard so TypeScript is happy)
**Verify**: `npm test` → all tests pass (Dashboard tests check rendered content, may need to adjust assertions — see Test plan below)
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

The existing Dashboard tests in `src/components/Dashboard.test.tsx` may break because they assert exact text content. Specifically:

- `Dashboard.test.tsx:31-34` asserts the spot price line — the assertion `screen.getByText(...)` may need updating to include the `· timeAgo(...)` suffix.

Run the tests first. If they fail, update the assertions in `Dashboard.test.tsx` to account for the new staleness text. The timestamp in test data (`highPrice: MetalPrice`) is `timestamp: 1`, which will render as "Actualizado hace unos segundos" since `Date.now() - 1` is < 60 seconds.

The simplest fix: change the assertion on lines 33-34 from:
```typescript
expect(screen.getByText(/2850,00/)).toBeInTheDocument()
```
to use `getAllByText` or a more flexible matcher — or just verify the spot price string is still present somewhere on the page. Since the new text is on the same line, use `screen.getByText` with a regex that matches the partial content: `screen.getByText((content) => content.includes('2.850,00'))`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` exits 0, all tests pass
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/components/Dashboard.tsx` contains the `timeAgo` function
- [ ] `src/components/Dashboard.tsx` displays `timeAgo(metalPrice.timestamp)` in the spot price line
- [ ] No files outside `src/components/Dashboard.tsx` (and possibly `src/components/Dashboard.test.tsx`) are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- The `timeAgo` calculation is placed outside `Dashboard.tsx` when it should be colocated.
- The spot price display structure has changed significantly (different DOM structure for the spot price line).
- Test failures require changes beyond the Dashboard test file.

## Maintenance notes

- The `timeAgo` helper does NOT re-render automatically. It computes the string at render time. For active use (e.g., a page left open for hours), the string will become stale — but this matches the app's design (no polling, manual refresh). If auto-refresh is added later, the `timeAgo` function will naturally reflect the updated `metalPrice.timestamp`.
- If more timestamp display needs emerge, extract `timeAgo` into a shared utility in `src/lib/utils.ts`. For now, colocation is simpler (only one call site).