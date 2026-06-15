# Plan 018: Bump esbuild and Vite deps to fix high-severity CVEs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 32ad920..HEAD -- package.json package-lock.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (breaking change from esbuild/vite major bump)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

`npm audit` reports 6 high-severity vulnerabilities in the esbuild dependency chain (esbuild → vite → vitest). The advisory (GHSA-gv7w-rqvm-qjhr) describes a remote code execution vector via the `NPM_CONFIG_REGISTRY` environment variable in esbuild's Deno module. While this is a dev dependency and the attack surface is limited (local dev machines, CI), it represents unnecessary risk. A force update to the latest compatible versions fixes all 6.

## Current state

`package.json` has the following relevant dependencies:
```json
"devDependencies": {
    "vite": "^8.0.12",
    "vitest": "^3.1.3",
    "@vitest/coverage-v8": "^3.2.6"
}
```

`npm audit --json` confirms esbuild versions `0.17.0 - 0.28.0` are vulnerable. The `esbuild` package is a transitive dependency of Vite (vite → esbuild).

The fix versions are:
- esbuild >= 0.25.2 (fixes the advisory)
- vite >= 8.0.5 already requires esbuild > 0.25.x — but the package-lock may pin an older esbuild

**Repo convention**: Dependencies use `^` ranges. The `package-lock.json` pins exact transitive versions.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Audit     | `npm audit`              | 0 vulnerabilities   |
| Build     | `npm run build`          | exit 0              |
| Test      | `npm test`               | all pass            |
| Lint      | `npm run lint`           | exit 0              |
| Dev       | `npm run dev`            | starts successfully |

## Scope

**In scope** (the only files you may modify):
- `package.json` — if a version bump is needed for vite/vitest
- `package-lock.json` — always updated by npm install

**Out of scope** (do NOT touch):
- No changes to source code or config files
- Do not update other dependencies
- Do not change `package.json` scripts

## Steps

### Step 1: Check current vulnerable versions

**Verify**: `npm audit` → confirm 6 high-severity findings exist (esbuild in the dependency chain)

### Step 2: Run audit fix

Run:
```
npm audit fix
```

This will update `package-lock.json` to resolve vulnerabilities within the current semver range. If `npm audit fix` alone resolves the issue without a force flag, that's the safest path.

**Verify**: `npm audit` → 0 vulnerabilities. If audit still reports issues, proceed to Step 3.

### Step 3: If needed, force the fix

If Step 2 doesn't resolve everything:
```
npm audit fix --force
```

This installs the latest compatible versions of vite/vitest (which may include breaking changes if the major version bumps). Accept this — it's a personal project, the API surface used by this app is stable, and Vite 8/9 are compatible with the same plugin API.

### Step 4: Verify everything works

**Verify**: `npm test` → all tests pass
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0
**Verify**: `npm audit` → 0 vulnerabilities

## Test plan

No new tests. This is a dependency update — the existing test suite (50 tests) serves as the regression check.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm audit` reports 0 high-severity vulnerabilities
- [ ] `npm test` exits 0, all tests pass
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] Only `package.json` and/or `package-lock.json` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `npm audit fix --force` introduces breaking changes that cause test failures that are not trivially fixable.
- Build or test suite fails after the update and the cause is not the dependency versions.
- Any source code change appears to be required.

## Maintenance notes

- Run `npm audit` periodically as part of your maintenance routine.
- The esbuild advisory primarily affects environments where `NPM_CONFIG_REGISTRY` can be attacker-controlled. In most local dev setups this is not exploitable, but fixing it eliminates the warning signal that could mask a real vulnerability.
- Vite 8 / Vitest 4 (or whatever version lands) may introduce new deprecation warnings. Verify `npm run build` and `npm run dev` still work if warnings appear — they can be addressed separately.