# Plan 026: Add schema validation to `importAllData` for imported JSON

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ff6a58a..HEAD -- src/lib/storage.ts src/lib/storage.test.ts src/App.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `ff6a58a`, 2026-06-16
- **Issue**: (none)

## Why this matters

The `importAllData` function (called when a user imports a JSON file via SettingsDialog) only checks `data.version !== 1` before blindly writing all fields to localStorage. A malformed JSON file — for example, `{ "version": 1, "assets": "not-an-array", "apiKey": null, "metalPrice": null }` — silently writes a string as the assets value. When the app next calls `getAssets()`, `JSON.parse` returns that string, and any `.map()`, `.filter()`, or `.reduce()` call on it throws a TypeError. The ErrorBoundary catches the crash, but the user's portfolio data is corrupted and they must click "Vaciar datos" to recover.

This is a data-integrity issue: the app accepts a file, trusts its contents without validation, and data loss is the consequence.

## Current state

- `src/lib/storage.ts` — storage helpers; `importAllData` at lines 95-102

```typescript
// storage.ts:95-102
export function importAllData(data: ExportData): void {
  if (!data || data.version !== 1) {
    throw new Error("Unsupported data format")
  }
  setItem(ASSETS_KEY, data.assets)
  setItem(API_KEY_KEY, data.apiKey ?? "")
  setItem(METAL_PRICE_KEY, data.metalPrice)
}
```

- `src/App.tsx` — `handleImport` at lines 102-119, calls `importAllData` inside a try/catch

```typescript
// App.tsx:102-119
function handleImport(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      importAllData(data)
      setAssets(getAssets())
      setApiKeyState(getApiKey())
      setMetalPrice(getMetalPrice())
      setError(null)
      setSuccess("Datos importados correctamente")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar datos")
    }
  }
  reader.readAsText(file)
}
```

- `src/lib/storage.test.ts` — existing test suite; one test for invalid version

The `ExportData` interface (used for type safety but not runtime validation):

```typescript
// storage.ts:77-83
export interface ExportData {
  version: number
  exportedAt: string
  assets: Asset[]
  apiKey: string | null
  metalPrice: MetalPrice | null
}
```

The `Asset` and `MetalPrice` types:

```typescript
// types.ts:2-15
export interface Asset {
  id: string
  type: AssetType  // "coin" | "bar"
  name: string
  country?: string
  year?: number
  weight: number
  weightUnit: "ozt" | "g"
  purity: number
  cost: number
  purchaseDate: string
  createdAt: string
}

// types.ts:17-21
export interface MetalPrice {
  xauUsd: number
  eurPerUsd: number
  timestamp: number
}
```

Repo conventions:
- Error handling uses thrown errors with `try/catch` at the call site (`App.tsx:114`)
- Validation is simple — no schema library (zod, io-ts, etc.) is used anywhere in the project
- Test pattern: see `storage.test.ts` for the existing import test — `describe("exportAllData / importAllData")`

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `npm test`               | 85+ tests pass      |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/lib/storage.ts` — add validation to `importAllData`
- `src/lib/storage.test.ts` — add tests for new validation

**Out of scope** (do NOT touch, even though they look related):
- `src/App.tsx` — `handleImport` already has a try/catch that handles thrown errors; no changes needed
- `src/types.ts` — no changes to interfaces
- `src/lib/utils.ts` — not needed
- Any other component files

## Git workflow

- Branch: `advisor/026-add-import-schema-validation`
- Commit style: `fix: validate imported data shape in importAllData`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add a validation helper to `storage.ts`

Add a private (unexported) function `isValidExportData` before `importAllData` in `src/lib/storage.ts`:

```typescript
function isValidExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  if (d.version !== 1) return false
  if (typeof d.exportedAt !== "string") return false
  if (!Array.isArray(d.assets)) return false
  for (const asset of d.assets) {
    if (!asset || typeof asset !== "object") return false
    const a = asset as Record<string, unknown>
    if (typeof a.id !== "string") return false
    if (a.type !== "coin" && a.type !== "bar") return false
    if (typeof a.name !== "string") return false
    if (typeof a.weight !== "number") return false
    if (a.weightUnit !== "ozt" && a.weightUnit !== "g") return false
    if (typeof a.purity !== "number") return false
    if (typeof a.cost !== "number") return false
    if (typeof a.purchaseDate !== "string") return false
    if (typeof a.createdAt !== "string") return false
  }
  if (d.apiKey !== null && typeof d.apiKey !== "string") return false
  if (d.metalPrice !== null) {
    if (typeof d.metalPrice !== "object") return false
    const mp = d.metalPrice as Record<string, unknown>
    if (typeof mp.xauUsd !== "number") return false
    if (typeof mp.eurPerUsd !== "number") return false
    if (typeof mp.timestamp !== "number") return false
  }
  return true
}
```

This validates:
- `version` is exactly `1`
- `exportedAt` is a string
- `assets` is an array of objects with all required `Asset` fields of the correct types
- `apiKey` is either null or a string
- `metalPrice` is either null or an object with required `MetalPrice` fields

**Key design decisions:**
- Do NOT add `country` or `year` validation — they're optional. Only validate required fields.
- Use simple type checks (`typeof`, `Array.isArray`) — no schema library dependency.
- The function is a type guard (`data is ExportData`), so the caller gets type narrowing.

**Verify**: `npm run build` → exit 0, no type errors.

### Step 2: Update `importAllData` to use the validator

Replace the body of `importAllData`:

```typescript
export function importAllData(data: ExportData): void {
  if (!isValidExportData(data)) {
    throw new Error("Unsupported data format")
  }
  setItem(ASSETS_KEY, data.assets)
  setItem(API_KEY_KEY, data.apiKey ?? "")
  setItem(METAL_PRICE_KEY, data.metalPrice)
}
```

The function signature stays the same (`ExportData` parameter) — the validator does runtime checking of what TypeScript already trusts at compile time.

**Verify**: `npm run build` → exit 0.

### Step 3: Add tests for the new validation

In `src/lib/storage.test.ts`, inside the `describe("exportAllData / importAllData")` block, add these test cases:

1. **"rejects data with non-array assets"**:
   `expect(() => importAllData({ version: 1, exportedAt: "", assets: "invalid", apiKey: null, metalPrice: null } as ExportData)).toThrow("Unsupported data format")`

2. **"rejects data with missing required asset fields"**:
   `expect(() => importAllData({ version: 1, exportedAt: "", assets: [{ id: "1" }], apiKey: null, metalPrice: null } as ExportData)).toThrow("Unsupported data format")`

3. **"rejects data with invalid asset type"**:
   `expect(() => importAllData({ version: 1, exportedAt: "", assets: [{ id: "1", type: "invalid", name: "Test", weight: 1, weightUnit: "ozt", purity: 99, cost: 100, purchaseDate: "2024-01-01", createdAt: "2024-01-01" }], apiKey: null, metalPrice: null } as ExportData)).toThrow("Unsupported data format")`

4. **"rejects data with non-numeric metalPrice fields"**:
   `expect(() => importAllData({ version: 1, exportedAt: "", assets: [validAsset], apiKey: null, metalPrice: { xauUsd: "2000", eurPerUsd: 0.92, timestamp: 1 } } as ExportData)).toThrow("Unsupported data format")`

5. **"accepts valid export data with all fields"** — Use the existing `data` object from the `it("importAllData restores data")` test (lines 181-188). Assert it does NOT throw.

6. **"accepts valid data with null metalPrice"**:
   `expect(() => importAllData({ version: 1, exportedAt: "", assets: [validAsset], apiKey: "key", metalPrice: null })).not.toThrow()`

For these tests, define a helper `validAsset` at the top of the describe block (or reuse the top-level `asset` fixture which is already defined at lines 5-15):

```typescript
const validAsset: ExportData["assets"][number] = {
  id: "1", type: "coin", name: "Test", weight: 1, weightUnit: "ozt",
  purity: 99.99, cost: 100, purchaseDate: "2024-01-01", createdAt: "2024-01-01T00:00:00Z",
}
```

**Verify**: `npm test` → all 90+ tests pass, including the new validation tests.

### Step 4: Lint and build

`npm run lint` → exit 0. `npm run build` → exit 0.

## Test plan

New test cases in `src/lib/storage.test.ts`:

| Test | What it validates |
|------|------------------|
| Rejects non-array assets | assets field type check |
| Rejects missing required asset fields | asset object completeness |
| Rejects invalid asset type | type enum check ("coin"/"bar") |
| Rejects non-numeric metalPrice fields | metalPrice field type check |
| Accepts valid export data | happy path (no regression) |
| Accepts valid data with null metalPrice | null metalPrice branch |

Pattern: model after the existing `it("importAllData throws on invalid version")` test at lines 190-192.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0; 6+ new test cases pass for `importAllData` validation
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] No files outside `src/lib/storage.ts` and `src/lib/storage.test.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `ExportData`, `Asset`, or `MetalPrice` interfaces have changed shape since this plan was written.
- The `setItem` helper signature has changed.
- Any existing test in `storage.test.ts` fails after adding new tests — do NOT modify existing test assertions.

## Maintenance notes

- If new fields are added to `Asset` or `MetalPrice`, update `isValidExportData` accordingly. The function is co-located with `importAllData` so it's easy to spot.
- If a schema validation library (zod, arktype) is adopted in the future, replace `isValidExportData` with that library — but keep the same error message for backward compatibility.
- The validation function is intentionally strict about required fields and lenient about optional fields (`country`, `year`). This matches the `ExportData` interface where those are optional.