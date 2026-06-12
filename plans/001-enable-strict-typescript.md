# Plan 001: Enable strict TypeScript mode in tsconfig

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 45920a0..HEAD -- tsconfig.app.json src/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `45920a0`, 2026-06-11

## Why this matters

`tsconfig.app.json` has no `"strict": true`, which means `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and `strictBindCallApply` are all off. This allows null-reference bugs, accidental `any` types, and incorrect function type variance to pass silently through typecheck. Enabling strict mode catches these at compile time. Doing it early prevents an accumulating debt of loose-typed code.

## Current state

The TypeScript compiler options in `tsconfig.app.json` (`tsconfig.app.json:19-22`) currently enable only:
```json
"noUnusedLocals": true,
"noUnusedParameters": true,
"erasableSyntaxOnly": true,
"noFallthroughCasesInSwitch": true
```

`"strict": true` is absent. This means none of the strict family checks are active. The codebase has 7 source files (~350 lines) — this is the ideal time to flip it on before the project grows.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc -b`             | exit 0, no errors   |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `tsconfig.app.json` — add `"strict": true`
- `src/**/*.ts` and `src/**/*.tsx` — fix any type errors that `strict` surfaces

**Out of scope** (do NOT touch, even though they look related):
- `tsconfig.node.json` — not a source config, leave alone
- Any behavior changes beyond type annotations
- Adding new tests or test infrastructure
- `tsconfig.json` — the root config is just a project reference file

## Git workflow

- Branch: `advisor/001-strict-typescript`
- Commits: one for the config change, then one fixup commit per type error category (squash if you prefer)
- Message style: `fix: enable strict TypeScript and resolve type errors`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Add `"strict": true` to `tsconfig.app.json`

Edit `tsconfig.app.json` to add `"strict": true` inside `"compilerOptions"`. The `compilerOptions` block currently (lines 2-23) starts with `"tsBuildInfoFile"` and ends with `"noFallthroughCasesInSwitch"`. Insert `"strict": true` after `"jsx": "react-jsx"` (line 16) to group it with the other linting options. The result should look like:

```json
"jsx": "react-jsx",

/* Linting */
"strict": true,
"noUnusedLocals": true,
```

**Verify**: `npx tsc -b` — this will fail with a list of type errors. Count them. That list is the work for step 2.

### Step 2: Fix every new type error

Run `npx tsc -b 2>&1` to see all errors. The most likely categories are:

**a) `null`/`undefined` not assignable** — variables that are `MetalPrice | null` or `string | null` being passed where `MetalPrice` or `string` is expected. Fix by adding proper null checks or optional chaining.

Example pattern — `Dashboard.tsx:23` currently reads:
```tsx
const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
```
This already handles null. But `metalPrice` may flow into places that assume it's non-null. Add explicit guards where needed — the same ternary pattern is the convention.

**b) Implicit `any`** — if any parameter or variable lacks a type annotation that `strict` surfaces, add the correct type. Match the repo convention of explicit typing (see `src/types.ts` for the project's type style).

**c) `object` access without index signature** — if code accesses `data.rates.XAU` where `rates` is typed loosely, you may need a more specific type for the API response. See `api.ts:23-24`. The cleanest fix is to define an inline type for the API response:

```typescript
interface MetalPriceApiResponse {
  success: boolean
  rates: Record<string, number>
}
```

Then cast or validate the response before accessing `rates.XAU` and `rates.EUR`.

Fix each error. Run `npx tsc -b` after each fix to confirm progress.

**Verify**: `npx tsc -b` → exit 0, no errors

**Verify**: `npm run lint` → exit 0

**Verify**: `npm run build` → exit 0

## Test plan

No new tests required. Existing build command is the verification: `npm run build` must pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `tsconfig.app.json` contains `"strict": true`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- More than 15 distinct type errors surface in step 1 (this suggests the codebase has drifted more than expected).

## Maintenance notes

- All future code will automatically benefit from strict checks — new PRs won't be able to introduce null-unsafe patterns.
- When adding new files, make sure they're included in `tsconfig.app.json`'s `"include": ["src"]`.
- If a particular line genuinely needs a looser check, use `// @ts-expect-error` with a comment explaining why, rather than weakening the config.