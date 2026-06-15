# Plan 021: Add data export and import (JSON backup/restore)

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
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

All portfolio data lives in localStorage with no backup mechanism. A browser cache clear, accidental `localStorage.clear()`, or switching devices loses everything. Export to JSON lets users save their portfolio as a file; import lets them restore it. This is the highest-impact resilience feature for a localStorage-only app.

## Current state

**Data shape** — all stored data is in localStorage under three keys (from `src/lib/storage.ts`):
- `gold-tracker:assets` — JSON array of `Asset[]`
- `gold-tracker:api-key` — string
- `gold-tracker:metal-price` — JSON of `MetalPrice`

**Export source** — `src/lib/storage.ts` exports getters for all data: `getAssets()`, `getApiKey()`, `getMetalPrice()`.

**UI location** — Settings are managed in `src/components/SettingsDialog.tsx`. The header is in `src/App.tsx` with buttons for add asset, refresh, and API key settings.

**Repo conventions**: File download uses the native `<a>` download pattern (no third-party lib). File upload uses a hidden `<input type="file">`. State management is local `useState` in `App.tsx`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Build     | `npm run build`          | exit 0              |
| Test      | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope**:
- `src/lib/storage.ts` — add `exportAllData()` and `importAllData()` functions
- `src/components/SettingsDialog.tsx` — add Export and Import buttons
- `src/App.tsx` — pass export/import handlers to SettingsDialog, reload state on import

**Out of scope**:
- No changes to AddAssetDialog, AssetTable, Dashboard
- No cloud sync or auto-backup
- No encryption of the exported file (it's a JSON file the user controls)

## Steps

### Step 1: Add export/import functions to storage

Add two functions at the end of `src/lib/storage.ts`:

```typescript
export interface ExportData {
  version: number
  exportedAt: string
  assets: Asset[]
  apiKey: string | null
  metalPrice: MetalPrice | null
}

export function exportAllData(): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    assets: getAssets(),
    apiKey: getApiKey(),
    metalPrice: getMetalPrice(),
  }
}

export function importAllData(data: ExportData): void {
  if (!data || data.version !== 1) {
    throw new Error("Unsupported data format")
  }
  setItem(ASSETS_KEY, data.assets)
  setItem(API_KEY_KEY, data.apiKey ?? "")
  setItem(METAL_PRICE_KEY, data.metalPrice)
}
```

The `version` field allows future format migrations. The `importAllData` function validates the version to prevent loading incompatible data.

**Verify**: `npx tsc -b` → exit 0 (the `ExportData` interface is exported — verify it shows in the module)

### Step 2: Add tests for export/import

Add a `describe("exportAllData / importAllData")` block in `src/lib/storage.test.ts`.

Tests:
1. **exportAllData returns current state** — save assets, API key, and a price; export; assert all three are present and correct.
2. **importAllData restores data** — save data via import, then read back via getters, assert all three match.
3. **importAllData throws on invalid version** — call `importAllData({ version: 999 } as any)`, assert error.
4. **importAllData replaces existing data** — save some data, then import different data, assert the imported data is what's returned.

**Verify**: `npm test -- src/lib/storage.test.ts` → existing + 4 new tests pass

### Step 3: Add export button to SettingsDialog

In `src/components/SettingsDialog.tsx`:

1. Add an `onExport?: () => void` prop and optionally an `onImport?: (file: File) => void` prop.

2. Below the API key form, add a section with export/import buttons:

```typescript
<div className="border-t pt-4">
  <Label className="text-sm font-medium">Datos</Label>
  <p className="text-xs text-muted-foreground mb-2">
    Exporta o importa tu cartera como archivo JSON.
  </p>
  <div className="flex gap-2">
    <Button type="button" variant="outline" onClick={onExport}>
      Exportar datos
    </Button>
    <Button type="button" variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
      Importar datos
    </Button>
  </div>
  <input
    id="import-file"
    type="file"
    accept=".json"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0]
      if (file) onImport?.(file)
      e.target.value = "" // allow re-importing the same file
    }}
  />
</div>
```

Use conditional rendering (`{onExport && ...}`) so the settings dialog works without these handlers.

**The import label warning**: Add a note (in the dialog description or near the button) that importing will replace all current data. Use a `<p className="text-xs text-amber-600">` or similar.

**Verify**: Render the dialog in dev mode (`npm run dev`) — export and import buttons should be visible when the `onExport` and `onImport` props are provided.

### Step 4: Wire export/import into App.tsx

In `src/App.tsx`:

1. Add an export handler:
```typescript
function handleExport() {
  const data = exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `gold-tracker-${new Date().toISOString().split("T")[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

2. Add an import handler:
```typescript
function handleImport(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      importAllData(data)
      setAssets(getAssets())
      setApiKeyState(getApiKey())
      setMetalPrice(getMetalPrice())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar datos")
    }
  }
  reader.readAsText(file)
}
```

3. Pass handlers to SettingsDialog:
```typescript
<SettingsDialog
  open={settingsOpen}
  onOpenChange={setSettingsOpen}
  existingKey={apiKey}
  onSave={handleSaveApiKey}
  onExport={handleExport}
  onImport={handleImport}
/>
```

**Verify**: `npx tsc -b` → exit 0

### Step 5: Verify everything

**Verify**: `npm test` → all tests pass
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

| File | New tests | What it covers |
|------|-----------|----------------|
| `src/lib/storage.test.ts` | 4 | exportAllData returns all data, importAllData restores it, version validation, replacement semantics |

Manual verification steps:
1. Add a few assets in the app
2. Open Settings → click "Exportar datos" → a `.json` file downloads
3. Clear localStorage (via browser dev tools)
4. Open Settings → click "Importar datos" → select the downloaded file
5. Assets should reappear in the dashboard and table

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` exits 0, all tests pass (including new storage tests)
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `exportAllData` and `importAllData` exist in `src/lib/storage.ts`
- [ ] `ExportData` interface is exported from `src/lib/storage.ts`
- [ ] SettingsDialog shows Export/Import buttons (when handlers provided)
- [ ] Import validates data format version
- [ ] Import shows error via App's error banner on failure
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- The import file reader callback has async issues (the `reader.onload` must handle `e.target?.result` being null).
- The download blob URL leaks (ensure `URL.revokeObjectURL` is called after click).
- Importing a file with a corrupt JSON should show an error in the existing `error` banner — not crash the app.

## Maintenance notes

- The `ExportData` interface has `version: 1`. If the `Asset` or `MetalPrice` types change in a breaking way (new required fields), bump the version to 2 and update `importAllData` to handle both versions (or reject old formats with a clear message).
- The exported file includes the API key. Users should be warned (perhaps in Settings UI text) not to share the file publicly since it contains their API key.
- File import uses the `FileReader` API — it's broadly supported across all modern browsers and has no dependency overhead.