# Plan 013: Add test suite (Vitest + React Testing Library)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 1614ce3..HEAD -- src/ vitest.config.ts tsconfig.app.json package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (all prior plans 001–012 are DONE)
- **Category**: tests
- **Planned at**: commit `1614ce3`, 2026-06-15
- **Issue**: N/A

## Why this matters

The project has zero tests. Four pure business-logic functions live in `src/lib/calculations.ts` (weight conversion, P&L calculation, portfolio aggregation) — these are the highest-risk code because they run every render and can display wrong money values. The localStorage abstraction in `src/lib/storage.ts` has edge cases (null/empty/malformed data) that only manual testing catches. The API layer in `src/lib/api.ts` has no regression protection. Without a test suite, every future change risks silent regressions in financial calculations.

Landing a Vitest + React Testing Library foundation lets the project grow with confidence and enables CI gating. This plan establishes the test infrastructure, writes comprehensive tests for the pure logic layer, and adds smoke tests for the two main components.

## Current state

- **`src/lib/calculations.ts`** — 6 pure functions, no side effects, no dependencies on browser APIs:
  ```ts
  // lines 3–5
  export function weightToOzt(weight: number, unit: "ozt" | "g"): number {
    return unit === "g" ? weight / 31.1035 : weight
  }

  // lines 7–9
  export function fineOzt(asset: Asset): number {
    return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
  }

  // lines 11–13
  export function currentValue(asset: Asset, spotEurPerOz: number): number {
    return fineOzt(asset) * spotEurPerOz
  }

  // lines 15–17
  export function calculateSpotEurPerOz(price: MetalPrice): number {
    return price.xauUsd * price.eurPerUsd
  }

  // lines 19–24
  export function assetPnL(asset: Asset, spotEurPerOz: number): { pnl: number; pnlPercent: number } {
    const value = currentValue(asset, spotEurPerOz)
    const pnl = value - asset.cost
    const pnlPercent = asset.cost > 0 ? (pnl / asset.cost) * 100 : 0
    return { pnl, pnlPercent }
  }

  // lines 26–35
  export function portfolioPnL(
    assets: Asset[],
    spotEurPerOz: number
  ): { totalCost: number; totalValue: number; pnl: number; pnlPercent: number } {
    const totalCost = assets.reduce((sum, a) => sum + a.cost, 0)
    const totalValue = assets.reduce((sum, a) => sum + currentValue(a, spotEurPerOz), 0)
    const pnl = totalValue - totalCost
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
    return { totalCost, totalValue, pnl, pnlPercent }
  }
  ```

- **`src/lib/storage.ts`** — localStorage wrapper with typed `getItem`/`setItem` helpers; one known edge case: `getItem` silently returns fallback on JSON parse failure.

- **`src/lib/api.ts`** — async fetch function with a real HTTP call (no test isolation today).

- **`src/types.ts`** — `Asset` and `MetalPrice` interfaces used across all lib modules.

- **No test dependencies in `package.json`**, no test config, no test runner.

## Commands you will need

| Purpose      | Command                    | Expected on success              |
|--------------|----------------------------|----------------------------------|
| Install      | `npm install`              | exit 0                           |
| Typecheck    | `npx tsc -b`               | exit 0, no errors                |
| Tests        | `npx vitest run`           | all tests pass, coverage summary |
| Test watch   | `npx vitest`               | interactive mode                 |
| Lint         | `npm run lint`             | exit 0                           |
| Build        | `npm run build`            | exit 0                           |

## Scope

**In scope** (the only files you should modify or create):
- `package.json` — add devDependencies and a `test` script
- `vitest.config.ts` — (create) Vitest configuration
- `src/lib/calculations.test.ts` — (create) tests for all 6 functions
- `src/lib/storage.test.ts` — (create) tests for localStorage abstraction
- `src/lib/api.test.ts` — (create) mock-based tests for API fetch
- `src/components/Dashboard.test.tsx` — (create) smoke + render test
- `src/components/AssetTable.test.tsx` — (create) smoke + render test
- `tsconfig.app.json` — add vitest type reference if needed
- `src/vite-env.d.ts` — (create or extend) add vitest reference types

**Out of scope** (do NOT touch, even though they look related):
- `src/App.tsx` — integration tests deferred; smoke-tested via child components
- `src/lib/utils.ts` — trivial one-liner wrapper around clsx+twMerge; not worth testing
- `src/components/AddAssetDialog.tsx`, `SettingsDialog.tsx`, `ErrorBoundary.tsx` — deferred to keep effort focused
- `src/components/ui/` — shadcn-style presentational wrappers; no logic to test
- Any changes to component implementation or business logic — tests only

## Git workflow

- Branch: `advisor/013-add-test-suite`
- Commit per step. Message style: conventional commits — e.g. `test: set up vitest and react-testing-library`, `test: add calculations unit tests`, `test: add storage unit tests`, `test: add api mock tests`, `test: add component smoke tests`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install test dependencies

Add these to `devDependencies` in `package.json`:

| Package                              | Purpose                         |
|--------------------------------------|---------------------------------|
| `vitest`                             | Test runner (Vite-native)       |
| `@testing-library/react`            | React component render/mount    |
| `@testing-library/jest-dom`         | DOM matchers (toBeInTheDocument)|
| `@testing-library/user-event`       | User interaction simulation     |
| `jsdom`                              | DOM environment for Vitest      |

Install by running `npm install` — this will resolve and lock them.

Add a `"test"` script in `package.json` next to the existing scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
```

**Verify**: `npm test` → fails with "No test files found" (expected — no tests yet).

### Step 2: Create Vitest configuration

Create `vitest.config.ts` at the repo root:

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
})
```

This reuses the existing Vite plugins so JSX/TS resolve the same way as in the app. `environment: "jsdom"` provides browser APIs (including `localStorage`). `globals: true` lets test files use `describe`/`it`/`expect` without imports.

Add `/// <reference types="vitest" />` to `src/vite-env.d.ts` (create the file if it doesn't exist) so TypeScript picks up vitest globals.

Also add `"types": ["vitest/globals"]` to the `compilerOptions` in `tsconfig.app.json` — alongside the existing `"types": ["vite/client"]`.

**Verify**: `npx tsc -b` → exit 0, no errors.

### Step 3: Write calculations unit tests

Create `src/lib/calculations.test.ts`. Test every function in `calculations.ts` exhaustively.

Follow this pattern (from the codebase conventions: no extra comments, concise expect calls):

```ts
import { weightToOzt, fineOzt, currentValue, calculateSpotEurPerOz, assetPnL, portfolioPnL } from "./calculations"
import type { Asset, MetalPrice } from "../types"

const baseAsset: Asset = {
  id: "1",
  type: "coin",
  name: "Krugerrand 1 oz",
  weight: 1,
  weightUnit: "ozt",
  purity: 91.67,
  cost: 2000,
  purchaseDate: "2024-01-15",
  createdAt: "2024-01-15T00:00:00.000Z",
}
```

Cover these cases:

| Function                 | Cases                                                                 |
|--------------------------|-----------------------------------------------------------------------|
| `weightToOzt`            | `ozt` returns same value; `g` divides by 31.1035; `0`; `null`-adjacent small values |
| `fineOzt`                | standard asset; `0` purity (returns `0`); `100` purity (fine = weight); grams input |
| `currentValue`           | normal case; spot=0 (returns 0); fineOzt=0; zero-spot edge           |
| `calculateSpotEurPerOz`  | normal XAU/USD * EUR/USD; zero rates; one rate zero                  |
| `assetPnL`               | profit case; loss case; break-even; zero cost (pnlPercent = 0)       |
| `portfolioPnL`           | empty array (all zeros); single asset; multiple assets; zero-cost asset in portfolio |

**Verify**: `npx vitest run` → all tests pass, coverage for `calculations.ts` shows 100% line coverage.

### Step 4: Write storage unit tests

Create `src/lib/storage.test.ts`. These tests mock localStorage (jsdom provides a real implementation, but isolation requires clearing between tests).

```ts
import { getAssets, saveAsset, deleteAsset, getApiKey, saveApiKey, getMetalPrice, saveMetalPrice } from "./storage"
import type { Asset, MetalPrice } from "../types"
```

Use `beforeEach(() => localStorage.clear())` to isolate tests.

Cover these cases:

| Function               | Cases                                                               |
|------------------------|---------------------------------------------------------------------|
| `getAssets`            | empty storage → `[]`; malformed JSON → `[]`; stored data → parsed correctly |
| `saveAsset`            | stores and retrieves one asset; multiple assets append               |
| `deleteAsset`          | deletes by id; deleting non-existent id (no-op); delete from single-item list → empty |
| `getApiKey` / `saveApiKey` | round-trip; overwrite; null when not set                       |
| `getMetalPrice` / `saveMetalPrice` | round-trip; timestamp preserved                            |

**Verify**: `npx vitest run` → all tests pass.

### Step 5: Write API mock tests

Create `src/lib/api.test.ts`. Mock `fetch` using `vi.fn()` to avoid real HTTP calls.

Pattern:
```ts
import { fetchMetalPrice } from "./api"

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
```

Cover these cases:

| Scenario                    | Mock behavior                                                    |
|-----------------------------|------------------------------------------------------------------|
| Successful response         | `fetch` returns `{ success: true, rates: { XAU: 0.0005, EUR: 0.92 } }` — verify xauUsd = 2000, eurPerUsd = 0.92 |
| API error (non-200)         | `fetch` returns `{ ok: false, status: 401, statusText: "Unauthorized" }` — verify error thrown |
| API error (bad data shape)  | `fetch` returns `{ success: false, error: "Invalid API key" }` — verify error message |
| API error (missing rates)   | `fetch` returns `{ success: true, rates: {} }` — verify error thrown |
| AbortError                  | `fetch` rejects with `DOMException` named `AbortError` — verify it propagates (caller handles it) |
| No API key configured       | Clear localStorage before call — verify error thrown              |

**Verify**: `npx vitest run` → all tests pass.

### Step 6: Write component smoke tests

Create `src/components/Dashboard.test.tsx` and `src/components/AssetTable.test.tsx`.

These test that components render without crashing and display the expected data values.

For `Dashboard.test.tsx`:
- Render with empty assets and null metalPrice — verify shows "0" for assets
- Render with one asset and a metalPrice — verify total cost, total value appear formatted (es-ES locale)
- Verify P&L cards show correct sign (green/red)

For `AssetTable.test.tsx`:
- Render with empty assets — verify "No hay activos" empty state
- Render with one asset — verify name, type, weight, purity, cost displayed
- Render with one asset and null metalPrice — verify "—" placeholder for value and P&L
- Click "Vender" button — verify `onDelete` callback is called with correct id

**Verify**: `npx vitest run` → all tests pass.

### Step 7: Verify full test suite

Run the full suite and confirm everything passes.

**Verify**: `npx vitest run` → exit 0, all tests pass. Then `npm run build` → exit 0. Then `npm run lint` → exit 0.

## Test plan

This plan **is** the test implementation plan. The tests written above become the project's regression suite:

| Test file                        | Count estimate | What it covers                        |
|----------------------------------|---------------|---------------------------------------|
| `src/lib/calculations.test.ts`   | ~20 tests     | Pure business logic, every edge       |
| `src/lib/storage.test.ts`        | ~12 tests     | localStorage CRUD + error states      |
| `src/lib/api.test.ts`            | ~6 tests      | API fetch with mocked responses       |
| `src/components/Dashboard.test.tsx` | ~3 tests   | Component render + data display       |
| `src/components/AssetTable.test.tsx` | ~4 tests  | Component render + interaction        |

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm test` exits 0, and coverage output shows at least one file covered
- [ ] `npx vitest run` produces a summary with all test files listed and passing
- [ ] `npx tsc -b` exits 0 (no type errors from test files)
- [ ] `npm run build` exits 0 (production build still works)
- [ ] `npm run lint` exits 0 (no lint errors from test files)
- [ ] `grep -r "vitest" src/lib/*.test.ts | wc -l` ≥ 1 per lib file (tests exist)
- [ ] No files outside the in-scope list are modified (`git status` shows only planned files)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted).
- `vitest` fails to install or has peer dependency conflicts with React 19 or Vite 8.
- `jsdom` environment doesn't support `localStorage` (unlikely in jsdom ≥20, but check).
- A step's verification fails twice after a reasonable fix attempt.
- The component tests cannot find CSS variables or Tailwind classes — these are cosmetic and can be safely wrapped in a test utility mock or skipped; do NOT add CSS imports or theme setup to test files.
- You discover that `import { describe, it, expect }` with `globals: true` doesn't work with TypeScript 6's `erasableSyntaxOnly` — if so, add explicit imports (`import { describe, it, expect } from "vitest"`) in each test file instead.

## Maintenance notes

- When new business logic is added to `src/lib/`, a corresponding `.test.ts` file should be created in the same directory (co-located test convention).
- The `vitest.config.ts` extends from Vite's config — if future Vite plugins are added (e.g. GraphQL, SVGR), they must be compatible with the test environment or be conditioned out via `process.env.VITEST`.
- Component tests use jsdom, which is not a real browser — complex DOM interactions (dialog `showModal`, scroll events) may need polyfills. Keep component tests as shallow smoke tests.
- If the project adds a backend or migrates to SSR, the test environment strategy will need revisiting (jsdom → happy-dom or node with more polyfills).
- Test coverage thresholds (`coverage.thresholds`) were deliberately omitted — add them in a follow-up after the suite has stabilized for a few commits.