# Plan 008: Add React Error Boundary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 728d33f..HEAD -- src/components/ src/App.tsx src/main.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: architecture
- **Planned at**: commit `728d33f`, 2026-06-12

## Why this matters

The app has zero error boundaries. If any component throws during rendering — corrupted localStorage data, unexpected API response shape, `toLocaleString` on NaN — the entire React tree unmounts to a white screen with a console error. A React Error Boundary catches these errors, logs them, and renders a fallback UI so the user can recover (e.g., clear data, refresh, contact support) instead of seeing a blank page.

## Current state

There is no error boundary component anywhere in `src/`. The `src/main.tsx` renders `<App />` directly inside `<StrictMode>` with no error containment:

```typescript
// src/main.tsx:6-9
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

The repo conventions for React components use function components with TypeScript. There are no class components in the codebase — the Error Boundary is the one exception where a class component is required (`componentDidCatch` lifecycle).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc -b`             | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Build     | `npm run build`          | exit 0              |

## Scope

**In scope**:
- `src/components/ErrorBoundary.tsx` — create a new class-based Error Boundary component
- `src/App.tsx` — wrap the main content with the Error Boundary

**Out of scope**:
- Any other component changes
- Adding error logging service or remote reporting
- Styling the error UI beyond basic Tailwind classes
- Changing `main.tsx`

## Git workflow

- Branch: `advisor/008-error-boundary`
- Commit message: `feat: add React Error Boundary for graceful crash recovery`
- One commit
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Create `src/components/ErrorBoundary.tsx`

Create a new file. Use a class component (required for `componentDidCatch`). Follow the file's naming convention (PascalCase, matching `Button.tsx`, `Card.tsx`).

```typescript
import { Component, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Algo salió mal
            </h1>
            <p className="text-muted-foreground">
              Ha ocurrido un error inesperado. Recarga la página o vacía los
              datos de la aplicación si el problema persiste.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Recargar
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Vaciar datos
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 overflow-auto rounded border bg-muted p-2 text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

The fallback UI:
- Shows a Spanish error title ("Algo salió mal") matching the app's locale.
- Provides two recovery buttons: "Recargar" (reload) and "Vaciar datos" (clear localStorage + reload).
- Has a collapsible `<details>` element showing the error message for debugging.

**Verify**: `npx tsc -b` → exit 0

### Step 2: Wrap App content with ErrorBoundary

In `src/App.tsx`, add the import at the top (after the existing component imports, line 8):
```typescript
import { ErrorBoundary } from "./components/ErrorBoundary"
```

Then wrap everything inside the return's root `<div>` — wrapping the main content and dialogs, but keeping the top-level layout:

Change lines 67-133 from:
```tsx
  return (
    <div className="min-h-screen bg-background">
      ...
    </div>
  )
```
to:
```tsx
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        ...
      </ErrorBoundary>
    </div>
  )
```

The `<ErrorBoundary>` wraps everything inside the `min-h-screen` div — the header, main content, and dialogs.

**Verify**: `npx tsc -b` → exit 0
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

No test infrastructure exists. Manual verification:
1. `npm run dev` — app loads normally, ErrorBoundary should not interfere.
2. Simulate a crash: temporarily add `throw new Error("test")` inside any component's render, refresh — you should see the fallback UI with "Algo salió mal", the "Recargar" and "Vaciar datos" buttons, and the error message behind the "Detalles técnicos" toggle.
3. Remove the throw — app returns to normal.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `src/components/ErrorBoundary.tsx` exists and exports `ErrorBoundary` class
- [ ] `src/App.tsx` imports `ErrorBoundary` from `./components/ErrorBoundary`
- [ ] `src/App.tsx` wraps content with `<ErrorBoundary>...</ErrorBoundary>` inside the root `div`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The fix requires touching an out-of-scope file.
- ESLint flags a rule violation that can't be resolved by following the existing patterns (e.g., class component rules not covered by the flat config).

## Maintenance notes

- The Error Boundary uses `any`-typed parameters via the parent class — this is standard for class component error boundaries. No TypeScript strictness issues expected.
- If the app ever adds a logging service (Sentry, LogRocket), the `componentDidCatch` method is where to integrate it.
- The "Vaciar datos" button is aggressive (clears ALL localStorage). If the app later stores non-user data (e.g., theme preference, tutorial state), consider scoping the clear to app-specific keys only (`gold-tracker:*`).