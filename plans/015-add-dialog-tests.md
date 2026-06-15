# Plan 015: Add tests for AddAssetDialog, SettingsDialog, and ErrorBoundary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- src/components/AddAssetDialog.tsx src/components/SettingsDialog.tsx src/components/ErrorBoundary.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

Three components have zero test coverage: `AddAssetDialog` (form validation logic), `SettingsDialog` (API key input), and `ErrorBoundary` (crash recovery UI). These contain user-facing functionality where regressions would be immediately visible. `AddAssetDialog` has non-trivial form state (6 fields, type toggle, validation) that benefits from characterization tests. `ErrorBoundary`'s recovery buttons are critical for UX when something goes wrong.

## Current state

`src/components/AddAssetDialog.tsx` — form with fields: type (coin/bar toggle), name, country, year, weight, weightUnit, purity, cost, purchaseDate. Validation at lines 70-78:
```typescript
const isValid =
    name.trim() !== "" &&
    weight !== "" && weightNum > 0 &&
    purity !== "" && purityNum > 0 && purityNum <= 100 &&
    cost !== "" && costNum > 0 &&
    purchaseDate !== ""
```

`src/components/SettingsDialog.tsx` — simple form, one field (API key), validation at line 71:
```typescript
<Button type="submit" disabled={!apiKey.trim()}>
```

`src/components/ErrorBoundary.tsx` — class component with `getDerivedStateFromError`, renders recovery UI with two buttons ("Recargar" and "Vaciar datos").

**Repo conventions for tests**: See `src/components/AssetTable.test.tsx` — the canonical pattern:
```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
```
Tests use `render(<Component ... />)`, `screen.getByText()`, `screen.getByRole()`, `userEvent.setup()` for interactions. The `beforeEach` is used in lib tests but components typically set up per-test. `vi.fn()` for mock callbacks.

`src/test-setup.ts` configures `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveClass`, etc.).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/components/AddAssetDialog.test.tsx` (create)
- `src/components/SettingsDialog.test.tsx` (create)
- `src/components/ErrorBoundary.test.tsx` (create)

**Out of scope** (do NOT touch, even though they look related):
- No changes to the components themselves — tests only
- No changes to existing tests
- No adding test IDs or `data-testid` attributes to the components — use text/role selectors only
- `App.tsx` integration tests — not in scope for this plan

## Steps

### Step 1: Create `AddAssetDialog.test.tsx`

Create `src/components/AddAssetDialog.test.tsx`. Follow the pattern from `AssetTable.test.tsx`.

Tests to write:

1. **Renders all form fields when open** — render with `open={true}`, assert the dialog title "Nuevo activo" is visible, the name input, type toggle buttons ("Moneda", "Lingote"), weight input, purity input, cost input, purchase date input.
2. **Submit button is disabled when form is empty** — assert the "Guardar" button is disabled (use `getByRole('button', { name: 'Guardar' })` and check `.toBeDisabled()`).
3. **Submit button is disabled with invalid purity** — fill valid name, weight, cost, date; set purity to "999" (over 100). Assert disabled.
4. **Submit button is disabled with zero weight** — fill valid name, purity, cost, date; set weight to "0". Assert disabled.
5. **Calls onSave with correct data on valid submit** — fill all fields with valid values, click "Guardar", assert `onSave` was called once with an object matching: `{ name: "Krugerrand 1 oz", type: "coin", weight: 1, weightUnit: "ozt", purity: 91.67, cost: 2100, purchaseDate: "2024-01-15" }`. Also assert `onSave` was NOT called with `id` or `createdAt` you can check — or just assert `.toMatchObject({name, type, weight, ...})`.
6. **Toggles between coin and bar types** — render, click "Lingote", assert the button variant changes (the active button has class containing "bg-primary" or similar). Or just assert clicking "Lingote" doesn't break the form.
7. **Calls onOpenChange(false) when Cancel is clicked** — click "Cancelar", assert `onOpenChange` was called with `false`.
8. **Country and year fields are optional** — fill only required fields (name, weight, purity, cost, date), submit, assert `onSave` was called with `country: undefined` and `year: undefined`.

Use `userEvent.setup()` for clicks and typing. For filling inputs: `await user.type(screen.getByLabelText('Nombre / designación'), 'Krugerrand 1 oz')` — use `getByLabelText` when `htmlFor` is set, otherwise use `getByPlaceholderText` or `getByRole`.

Note: The form uses `<input>` elements with `<Label htmlFor="...">`. Use `getByLabelText` to find inputs by their label text.

**Verify**: `npm test -- src/components/AddAssetDialog.test.tsx` → 8 tests pass

### Step 2: Create `SettingsDialog.test.tsx`

Create `src/components/SettingsDialog.test.tsx`.

Tests to write:

1. **Renders API key input when open** — render with `open={true}`, assert dialog title "Configuración" is visible, the API key input is present.
2. **Submit button is disabled when input is empty** — assert "Guardar" button is disabled.
3. **Calls onSave with trimmed key** — type "  my-api-key  " into the input (with spaces), click "Guardar", assert `onSave` was called with `"my-api-key"`.
4. **Calls onOpenChange(false) when Cancel is clicked** — click "Cancelar", assert `onOpenChange` was called with `false`.
5. **Pre-fills existing key** — render with `existingKey="my-key"`, assert the input value is "my-key". (Use `getByDisplayValue('my-key')`.)

**Verify**: `npm test -- src/components/SettingsDialog.test.tsx` → 5 tests pass

### Step 3: Create `ErrorBoundary.test.tsx`

Create `src/components/ErrorBoundary.test.tsx`. ErrorBoundary is a class component — testing requires rendering it with a child that throws.

Tests to write:

1. **Renders children when no error** — render `<ErrorBoundary><div>Hello</div></ErrorBoundary>`, assert "Hello" is visible.
2. **Renders error UI when child throws** — create a component `function Bomb() { throw new Error("Test error") }` inside the test file. Render `<ErrorBoundary><Bomb /></ErrorBoundary>`. Assert "Algo salió mal" is visible.
3. **Shows error details when "Detalles técnicos" is clicked** — render with a throwing child, click the details summary ("Detalles técnicos"), assert "Test error" is visible in the `<pre>` block.
4. **"Recargar" button exists with correct text** — render with throwing child, assert a button with text "Recargar" exists.
5. **"Vaciar datos" button exists with correct text** — render with throwing child, assert a button with text "Vaciar datos" exists.

For the throwing child pattern:
```typescript
function Bomb() {
  throw new Error("Test error")
}
// Suppress the console.error that React logs for caught errors
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
render(
  <ErrorBoundary>
    <Bomb />
  </ErrorBoundary>
)
consoleSpy.mockRestore()
```

Import `vi from "vitest"` at the top of the file.

**Verify**: `npm test -- src/components/ErrorBoundary.test.tsx` → 5 tests pass

### Step 4: Verify the full suite

**Verify**: `npm test` → all existing tests (50) + new tests (18) = 68+ tests pass
**Verify**: `npm run lint` → exit 0, no src/ errors
**Verify**: `npm run build` → exit 0

## Test plan

All tests live in new files under `src/components/`:

| File | Tests | What it covers |
|------|-------|----------------|
| `AddAssetDialog.test.tsx` | 8 | form rendering, validation states, submission, type toggle, cancellation, optional fields |
| `SettingsDialog.test.tsx` | 5 | form rendering, validation, trimmed submission, pre-fill, cancellation |
| `ErrorBoundary.test.tsx` | 5 | normal rendering, error state, detail expansion, button presence |

Total new tests: 18

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0; 18 new tests exist and pass
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] Files created: `src/components/AddAssetDialog.test.tsx`, `src/components/SettingsDialog.test.tsx`, `src/components/ErrorBoundary.test.tsx`
- [ ] No changes to any `.tsx` files outside `src/components/*.test.tsx` (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the target component files have been modified since this plan was written (drift check) — the test selectors may not match.
- A test cannot be written without adding `data-testid` or modifying the component.
- `console.error` suppression in ErrorBoundary test causes other tests to fail (ensure `vi.spyOn(console, 'error')` is restored).
- Import paths (e.g., `../types`, `../lib/storage`, `./ui/Button`) don't resolve from test files.

## Maintenance notes

- If form fields are added/removed from AddAssetDialog, the validation tests must be updated to match.
- If the ErrorBoundary UI changes (different recovery buttons or copy), update the ErrorBoundary tests accordingly.
- The tests use `userEvent` from `@testing-library/user-event` — always `await` user interactions. Model new test files on `AssetTable.test.tsx` which correctly uses `userEvent.setup()`.