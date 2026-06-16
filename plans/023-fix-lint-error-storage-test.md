# Plan 023: Fix lint error — replace `as any` in storage.test.ts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ff6a58a..HEAD -- src/lib/storage.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ff6a58a`, 2026-06-16
- **Issue**: (none)

## Why this matters

`npm run lint` exits with a non-zero code because of one `@typescript-eslint/no-explicit-any` error in the test file. This blocks CI lint gates and forces developers to visually filter it out. Fixing it makes lint clean, which is the prerequisite for treating warnings as errors or adding a pre-commit hook.

## Current state

- `src/lib/storage.test.ts` — test suite for localStorage helpers; 219 lines

At line 191, the test for invalid version uses `as any` to bypass TypeScript:

```typescript
// storage.test.ts:190-192
it("importAllData throws on invalid version", () => {
  expect(() => importAllData({ version: 999 } as any)).toThrow("Unsupported data format")
})
```

The `ExportData` interface expects `version: number`, `assets: Asset[]`, `apiKey: string | null`, `metalPrice: MetalPrice | null`, `exportedAt: string`. Passing `{ version: 999 }` intentionally violates this to test the validation guard.

Repo convention: test files follow the existing pattern in this file — plain objects, no `as any`. The only `as` cast in the file is this one line.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Lint      | `npm run lint`           | exit 0, no errors   |
| Tests     | `npm test`               | 85+ tests pass      |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/lib/storage.test.ts` — one line change

**Out of scope** (do NOT touch, even though they look related):
- Any production code
- Any other test files
- `eslint.config.js` (the rule config is fine — fixing the source is the right approach)
- The `ExportData` interface — it's correctly typed; the test just needs a better way to pass an invalid value

## Git workflow

- Branch: `advisor/023-fix-lint-error-storage-test`
- Commit style: `fix: replace as any in importAllData test` (matches conventional commits in `git log`)
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Replace `as any` with a properly typed partial object

In `src/lib/storage.test.ts`, line 191, replace:

```typescript
expect(() => importAllData({ version: 999 } as any)).toThrow("Unsupported data format")
```

with a value that satisfies TypeScript's type checking while still being invalid at runtime. Use a type cast via `as` to a partial of the expected interface:

```typescript
expect(() => importAllData({ version: 999 } as ExportData)).toThrow("Unsupported data format")
```

This requires adding `ExportData` to the existing import on line 2 of the same file. The current import is:

```typescript
import { getAssets, saveAsset, deleteAsset, updateAsset, getApiKey, saveApiKey, getMetalPrice, saveMetalPrice, clearAppData, exportAllData, importAllData, getAutoRefreshInterval, saveAutoRefreshInterval } from "./storage"
```

Add `ExportData` at the end of the named imports from `"./storage"`.

**Verify**: `npm run lint` → exit 0, no errors or warnings related to `src/lib/storage.test.ts`. (Warnings from `coverage/` files may remain — those are addressed in a separate plan.)

### Step 2: Run tests to confirm nothing broke

`npm test` → 85+ tests pass, including the updated `importAllData throws on invalid version` test.

### Step 3: Build to confirm type safety

`npm run build` → exit 0, no errors.

## Test plan

No new tests needed. The existing `importAllData throws on invalid version` test continues to pass with the fixed typing. The change is only to the type assertion, not to the test logic.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0 with no errors in `src/lib/storage.test.ts`
- [ ] `npm test` exits 0, all existing tests pass
- [ ] `npm run build` exits 0
- [ ] No files outside `src/lib/storage.test.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `storage.test.ts:190-192` doesn't match the excerpt (drifted since plan was written).
- `npm test` fails — do NOT try to fix unrelated test failures.
- Removing `as any` causes a genuine type error that requires changing the `ExportData` interface (that's a different change with different risk).

## Maintenance notes

- If the `ExportData` interface changes shape (adds required fields), this test may need an additional property in the partial object. Keep the approach of using a partial object instead of `as any`.
- The `globalIgnores` for coverage dir in `eslint.config.js` is addressed in a separate plan (024). Both should land before lint gates are enabled.