# Plan 022: Add price staleness display and configurable auto-refresh

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- src/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 019 (price staleness indicator)
- **Category**: direction
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

Gold prices change throughout the trading day. Currently, users must manually click "Actualizar precios" to get fresh data — there's no way to know how stale the displayed price is, and no option to let the app refresh automatically. Adding a staleness display (from plan 019) plus configurable auto-refresh (every N minutes) gives users confidence in the data without manual intervention.

## Current state

`src/App.tsx:45-51` — the initial fetch on mount uses `setTimeout` with no interval:
```typescript
useEffect(() => {
  if (apiKey) {
    const timer = setTimeout(() => refreshPrice(apiKey))
    return () => clearTimeout(timer)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [apiKey])
```

`src/App.tsx:83-89` — manual refresh button:
```typescript
<Button
  variant="outline"
  onClick={() => refreshPrice()}
  disabled={loading}
>
  {loading ? "Actualizando..." : "Actualizar precios"}
</Button>
```

`src/components/SettingsDialog.tsx` — currently only has the API key input. No auto-refresh settings.

`src/lib/storage.ts:49-56` — `getMetalPrice()` / `saveMetalPrice()` handle the cached price. The timestamp is set on fetch (`api.ts:31: timestamp: Date.now()`).

**Repo convention**: Settings are stored in localStorage with the `gold-tracker:` prefix. The SettingsDialog is a modal with a form at the top.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Build     | `npm run build`          | exit 0              |
| Test      | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope**:
- `src/lib/storage.ts` — add getter/setter for auto-refresh interval preference
- `src/components/SettingsDialog.tsx` — add auto-refresh toggle with interval selector
- `src/App.tsx` — add polling logic using `setInterval`, honor the user's interval preference
- `src/components/Dashboard.tsx` — if plan 019 not yet executed, add staleness display

**Out of scope**:
- `useInterval` custom hook — use plain `setInterval` with cleanup in `useEffect`
- No changes to `AddAssetDialog`, `AssetTable`, `ErrorBoundary`
- No push notifications or background sync (service workers)

## Steps

### Step 1: Add auto-refresh preference to storage

In `src/lib/storage.ts`, add two functions:

```typescript
const AUTO_REFRESH_KEY = "gold-tracker:auto-refresh-interval"

export function getAutoRefreshInterval(): number {
  return getItem<number>(AUTO_REFRESH_KEY, 0) // 0 = disabled
}

export function saveAutoRefreshInterval(minutes: number): void {
  setItem(AUTO_REFRESH_KEY, minutes)
}
```

The value is in minutes. 0 means auto-refresh is disabled. Valid values: 0, 5, 10, 15, 30, 60.

**Verify**: `grep -n "AUTO_REFRESH_KEY\|getAutoRefreshInterval\|saveAutoRefreshInterval" src/lib/storage.ts` → all three symbols present.

### Step 2: Add tests for auto-refresh preference

Add a `describe("getAutoRefreshInterval / saveAutoRefreshInterval")` block in `src/lib/storage.test.ts`.

Tests:
1. **Defaults to 0 when not set** — `expect(getAutoRefreshInterval()).toBe(0)`.
2. **Round-trips a value** — `saveAutoRefreshInterval(15)`, then `expect(getAutoRefreshInterval()).toBe(15)`.
3. **Overwrites existing value** — save 5, save 30, assert 30.

**Verify**: `npm test -- src/lib/storage.test.ts` → existing + 3 new tests pass

### Step 3: Add auto-refresh UI to SettingsDialog

In `src/components/SettingsDialog.tsx`:

1. Add `autoRefreshInterval?: number` and `onSaveAutoRefresh?: (minutes: number) => void` props.
2. Below the API key form (and below the export/import section if plan 021 is also being executed), add an auto-refresh section:

```typescript
<div className="border-t pt-4">
  <Label className="text-sm font-medium">Actualización automática</Label>
  <p className="text-xs text-muted-foreground mb-2">
    Actualiza el precio del oro automáticamente cada cierto tiempo.
  </p>
  <select
    value={autoRefreshInterval ?? 0}
    onChange={(e) => onSaveAutoRefresh?.(Number(e.target.value))}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
  >
    <option value={0}>Desactivado</option>
    <option value={5}>Cada 5 minutos</option>
    <option value={10}>Cada 10 minutos</option>
    <option value={15}>Cada 15 minutos</option>
    <option value={30}>Cada 30 minutos</option>
    <option value={60}>Cada 1 hora</option>
  </select>
</div>
```

Use conditional rendering (`{onSaveAutoRefresh && ...}`) so the dialog works without the feature.

**Verify**: No build errors with `npx tsc -b`.

### Step 4: Add polling logic to App.tsx

In `src/App.tsx`:

1. Import the new storage functions:
```typescript
import { getAssets, saveAsset, deleteAsset, getApiKey, saveApiKey, getMetalPrice, getAutoRefreshInterval, saveAutoRefreshInterval } from "./lib/storage"
```

2. Add state for auto-refresh:
```typescript
const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => getAutoRefreshInterval())
```

3. Add a `useEffect` for polling:
```typescript
useEffect(() => {
  if (!apiKey || autoRefreshInterval <= 0) return

  const intervalId = setInterval(() => refreshPrice(apiKey), autoRefreshInterval * 60 * 1000)
  return () => clearInterval(intervalId)
}, [apiKey, autoRefreshInterval])
```

4. Add a handler for saving the preference:
```typescript
function handleSaveAutoRefresh(minutes: number) {
  saveAutoRefreshInterval(minutes)
  setAutoRefreshInterval(minutes)
}
```

5. Pass the handler and value to SettingsDialog:
```typescript
<SettingsDialog
  open={settingsOpen}
  onOpenChange={setSettingsOpen}
  existingKey={apiKey}
  onSave={handleSaveApiKey}
  autoRefreshInterval={autoRefreshInterval}
  onSaveAutoRefresh={handleSaveAutoRefresh}
/>
```

6. Add a visual indicator in the header showing the auto-refresh status (optional but helpful). A small text next to the refresh button:
```typescript
{autoRefreshInterval > 0 && (
  <span className="text-xs text-muted-foreground">
    Auto: {autoRefreshInterval} min
  </span>
)}
```

**Verify**: `npx tsc -b` → exit 0

### Step 5: Handle plan 019 dependency — staleness display

If plan 019 was NOT executed before this plan, add the `timeAgo` function and staleness display in `Dashboard.tsx` as described in plan 019's steps 1-2. If plan 019 was already executed, verify it's present and skip.

**Verify**: `grep -n "timeAgo" src/components/Dashboard.tsx` → function exists and is used.

### Step 6: Verify everything

**Verify**: `npm test` → all tests pass
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

| File | New tests | What it covers |
|------|-----------|----------------|
| `src/lib/storage.test.ts` | 3 | auto-refresh preference defaults, round-trip, overwrite |

Manual verification:
1. Open app with an API key configured
2. Open Settings, set auto-refresh to 5 minutes
3. Close settings, verify the text "Auto: 5 min" appears in the header
4. Wait 5 minutes (or check with dev tools that `setInterval` fires), verify the price refreshes and the staleness text updates
5. Re-open settings, change to "Desactivado", verify polling stops

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` exits 0, all tests pass (including new storage tests)
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `getAutoRefreshInterval` and `saveAutoRefreshInterval` exist in `src/lib/storage.ts`
- [ ] SettingsDialog has an auto-refresh interval selector (when `onSaveAutoRefresh` provided)
- [ ] App.tsx has a polling `useEffect` keyed on `apiKey` and `autoRefreshInterval`
- [ ] Polling interval is properly cleaned up on unmount or interval change
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- Plan 019 was NOT executed and the staleness display requires significant additional effort beyond what's described in plan 019.
- The polling interval doesn't account for the user tab being backgrounded (browsers throttle `setInterval` to 1 minute minimum in background tabs — this is acceptable behavior, not a bug).
- The SettingsDialog already has an export/import section from plan 021 — the auto-refresh section should be added after it, not replace it.

## Maintenance notes

- Browsers throttle `setInterval` to at most once per minute when a tab is backgrounded. The 5-minute minimum interval means this is acceptable — the price will update within ~1 minute of the tab being re-focused.
- If API rate limiting is a concern (metalpriceapi.com free tier has limited requests), the minimum 5-minute interval limits requests to max 12/hour.
- Future improvement: add a visual "last updated" timestamp rather than just relative time, using `Intl.DateTimeFormat` for absolute times when the user hovers or clicks the staleness text.
- The `refreshPrice` function already handles concurrent requests via the `AbortController` pattern (from plan 005) — it aborts the previous request before starting a new one, so rapid interval+manual refresh combos are safe.