# Plan 025: Add tests for SettingsDialog export/import and auto-refresh sections

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ff6a58a..HEAD -- src/components/SettingsDialog.test.tsx src/components/SettingsDialog.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ff6a58a`, 2026-06-16
- **Issue**: (none)

## Why this matters

The coverage report shows `SettingsDialog.tsx` at only 57% statement coverage and 38% branch coverage. Two entire feature sections — the data export/import section (lines 85-113) and the auto-refresh section (lines 116-135) — have zero test coverage. These are user-facing features added in prior plans (021 and 022) that can silently regress. Adding tests protects against regressions and makes future refactoring safe.

## Current state

- `src/components/SettingsDialog.tsx` — settings dialog with API key, data export/import, and auto-refresh controls
- `src/components/SettingsDialog.test.tsx` — existing test file, 39 lines, covers only the API key input section

The existing tests cover:
- Renders API key input when open
- Submit button disabled when empty
- Calls onSave with trimmed key
- Calls onOpenChange(false) on Cancel
- Pre-fills existing key

The **untested sections** are conditionally rendered based on props:

**Data section** (renders only when both `onExport` and `onImport` are provided):
```tsx
// SettingsDialog.tsx:85-113
{onExport && onImport && (
  <div className="border-t pt-4 mt-4">
    <Label className="text-sm font-medium">Datos</Label>
    <p className="text-xs text-muted-foreground mb-2">
      Exporta o importa tu cartera como archivo JSON.
    </p>
    <p className="text-xs text-amber-600 mb-2">
      Importar reemplazará todos los datos actuales.
    </p>
    <div className="flex gap-2">
      <Button type="button" variant="outline" onClick={onExport}>
        Exportar datos
      </Button>
      <Button type="button" variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
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
        if (file) onImport(file)
        e.target.value = ""
      }}
    />
  </div>
)}
```

**Auto-refresh section** (renders only when `onSaveAutoRefresh` is provided):
```tsx
// SettingsDialog.tsx:116-135
{onSaveAutoRefresh !== undefined && (
  <div className="border-t pt-4 mt-4">
    <Label className="text-sm font-medium">Actualización automática</Label>
    <p className="text-xs text-muted-foreground mb-2">
      Actualiza el precio del oro automáticamente cada cierto tiempo.
    </p>
    <select
      value={autoRefreshInterval ?? 0}
      onChange={(e) => onSaveAutoRefresh(Number(e.target.value))}
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
)}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `npm test`               | 85+ tests pass      |
| Coverage  | `npx vitest run --coverage` | >57% stmts on SettingsDialog |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/components/SettingsDialog.test.tsx` — add new test cases

**Out of scope** (do NOT touch, even though they look related):
- `SettingsDialog.tsx` — no production code changes
- `App.tsx` — no integration/end-to-end tests
- Any other test files

## Git workflow

- Branch: `advisor/025-add-settingsdialog-coverage`
- Commit style: `test: add SettingsDialog coverage for data and auto-refresh sections`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Read the existing test file and confirm the pattern

Read `src/components/SettingsDialog.test.tsx` to understand the existing testing conventions:
- Uses `vitest` (`describe`, `it`, `expect`, `vi`)
- Uses `@testing-library/react` (`render`, `screen`)
- Uses `userEvent` from `@testing-library/user-event`
- Tests render basic UI elements, callbacks, and conditional behavior
- Imports are: `import { describe, it, expect, vi } from "vitest"`

### Step 2: Add tests for the data export/import section

Add a `describe("data section")` block after the existing tests with these test cases:

1. **"renders export/import section when onExport and onImport are provided"** — Render with both `onExport={vi.fn()}` and `onImport={vi.fn()}`. Assert:
   - Text "Exportar datos" button is in the document
   - Text "Importar datos" button is in the document
   - The warning "Importar reemplazará todos los datos actuales" is visible

2. **"does not render export/import section when onExport and onImport are omitted"** — Render without those props (match the existing test pattern). Assert that "Exportar datos" is NOT in the document.

3. **"calls onExport when Exportar datos button is clicked"** — Render with `onExport={vi.fn()}` and `onImport={vi.fn()}`. Click the "Exportar datos" button. Assert `onExport` was called once.

4. **"file input exists and is hidden"** — Render with both callbacks. Assert:
   - A file input (`input[type="file"]`) exists
   - It has the class `hidden` (or `className` contains "hidden")
   - It accepts `.json`

**Verify**: `npm test` → all tests pass, the `SettingsDialog.test.tsx` file runs without errors.

### Step 3: Add tests for the auto-refresh section

Add a `describe("auto-refresh section")` block:

1. **"renders auto-refresh select when onSaveAutoRefresh is provided"** — Render with `onSaveAutoRefresh={vi.fn()}` and `autoRefreshInterval={0}`. Assert:
   - Text "Actualización automática" is visible
   - A `<select>` element is in the document
   - "Desactivado" option is visible

2. **"does not render when onSaveAutoRefresh is omitted"** — Render without the prop. Assert "Actualización automática" is NOT in the document.

3. **"pre-selects the current interval value"** — Render with `autoRefreshInterval={15}`. Assert that the select element's display value shows the "Cada 15 minutos" option (can check `(screen.getByRole("combobox") as HTMLSelectElement).value === "15"`).

4. **"calls onSaveAutoRefresh when selection changes"** — Render with `onSaveAutoRefresh={vi.fn()}`. Change the select value to `30`. Assert `onSaveAutoRefresh` was called with `30`.

**Verify**: `npm test` → all tests pass.

### Step 4: Run coverage to confirm improvement

`npx vitest run --coverage` → Check that `SettingsDialog.tsx` statement coverage increased above 80% and branch coverage increased above 70%.

### Step 5: Lint and build

`npm run lint` → exit 0. `npm run build` → exit 0.

## Test plan

New test cases in `src/components/SettingsDialog.test.tsx`:

| Test | Section | What it covers |
|------|---------|---------------|
| Renders export/import when callbacks provided | Data | Conditional rendering true branch |
| Does not render when callbacks omitted | Data | Conditional rendering false branch |
| Calls onExport on click | Data | Button onClick handler |
| File input is hidden and accepts .json | Data | HTML element attributes |
| Renders auto-refresh when callback provided | Auto-refresh | Conditional rendering true branch |
| Does not render when callback omitted | Auto-refresh | Conditional rendering false branch |
| Pre-selects current interval | Auto-refresh | value prop binding |
| Calls onSaveAutoRefresh on change | Auto-refresh | onChange handler |

Pattern: model after existing tests in `SettingsDialog.test.tsx` (same imports, `vi.fn()` for callbacks, `screen.getByText` / `screen.getByRole` for assertions).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0; SettingsDialog tests include 7+ new test cases beyond the existing 5
- [ ] `npx vitest run --coverage` shows `SettingsDialog.tsx` statement coverage ≥80%
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] No files outside `src/components/SettingsDialog.test.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The SettingsDialog component structure has changed since this plan was written (lines 85-135 differ).
- Any existing test fails after adding new tests — do NOT modify existing test assertions.
- The coverage tool is unavailable or reports differently than described.

## Maintenance notes

- If new conditionally-rendered sections are added to SettingsDialog, add corresponding tests at the same time.
- The `onImport` file input test uses a hidden `<input>` (not a button). To fully test file selection, you'd need `fireEvent.change` on the input with a `File` object — the current test plan skips that (hard to do without a real File object in jsdom) but leaves the structural test in place.