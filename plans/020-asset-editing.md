# Plan 020: Add asset editing capability

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
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `32ad920`, 2026-06-15

## Why this matters

Users can add and delete assets but cannot edit them. To correct a typo or update a cost, they must delete and re-add. This is friction for the primary workflow — managing a portfolio. Adding edit support completes the CRUD surface.

## Current state

- `src/lib/storage.ts` has `saveAsset` (append-only) and `deleteAsset` (by ID). No `updateAsset`.
- `src/components/AssetTable.tsx` renders each asset row with a "Vender" (delete) button but no edit button.
- `src/components/AddAssetDialog.tsx` is the form for creating assets. It always starts empty (reset on close).
- `src/App.tsx` passes `onDelete` to AssetTable but has no edit handler.
- `src/types.ts` — all Asset fields are mutable (no readonly or partial variants).

**Repo convention**: UI components follow shadcn/ui patterns. Dialogs use the custom `Dialog` component in `src/components/ui/Dialog.tsx`. Forms use `Input`, `Label`, `Button` from `src/components/ui/`. State management is local `useState` in components — no global state library.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Build     | `npm run build`          | exit 0              |
| Lint      | `npm run lint`           | exit 0              |
| Test      | `npm test`               | all pass            |
| Typecheck | `npx tsc -b`             | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/lib/storage.ts` — add `updateAsset()` function
- `src/components/AddAssetDialog.tsx` — refactor to accept optional `editAsset` prop; when provided, pre-fill fields and use the update path on submit
- `src/components/AssetTable.tsx` — add an "Editar" button per row
- `src/App.tsx` — add edit state, pass edit handler to AssetTable and AddAssetDialog
- Test files for the above (create/update)

**Out of scope** (do NOT touch):
- Extracting a shared form component — `AddAssetDialog` handles both add and edit
- Adding an edit route or URL state — keep the modal pattern
- Changing `SettingsDialog.tsx` or `ErrorBoundary.tsx`
- Changing the `Asset` type

## Steps

### Step 1: Add `updateAsset()` to storage

In `src/lib/storage.ts`, add a function that replaces an asset by ID:

```typescript
export function updateAsset(id: string, updates: Partial<Omit<Asset, "id" | "createdAt">>): void {
  const assets = getAssets().map((a) =>
    a.id === id ? { ...a, ...updates } : a
  )
  setItem(ASSETS_KEY, assets)
}
```

Model the immutability pattern on `deleteAsset` (uses `.filter()`) and the updated `saveAsset` from plan 016 (uses spread).

**Verify**: `grep -n "export function updateAsset" src/lib/storage.ts` → shows the function

### Step 2: Add tests for `updateAsset()`

Add a `describe("updateAsset")` block at the end of `src/lib/storage.test.ts`.

Tests:
1. **Updates an existing field** — save two assets, update one's name, assert only that asset changed.
2. **Returns asset unchanged when ID not found** — save an asset, call `updateAsset` with nonexistent ID, assert asset is unchanged.
3. **Only updates specified fields** — save asset, update only `cost`, assert `name` and `weight` are unchanged.

**Verify**: `npm test -- src/lib/storage.test.ts` → existing + 3 new tests pass

### Step 3: Add edit button to AssetTable

In `src/components/AssetTable.tsx`:

1. Add an `onEdit?: (asset: Asset) => void` prop to `AssetTableProps`.
2. Add an "Editar" button to each row, next to the "Vender" button (or before it):

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => onEdit(asset)}
>
  Editar
</Button>
```

Wrap it in a conditional `{onEdit && (...)}` so the table works without the edit handler.

**Verify**: `npx tsc -b` → exit 0

### Step 4: Refactor AddAssetDialog to support editing

In `src/components/AddAssetDialog.tsx`:

1. Add an optional `editAsset?: Asset` prop to `AddAssetDialogProps`.
2. When `editAsset` is set (not undefined), pre-fill all form fields from the asset data. Use a `useEffect` (or an `initialState` derived from the prop) to populate the fields when the dialog opens.
3. Change the submit handler: if `editAsset` is provided, call `onSave` with the updated asset (same ID as `editAsset.id`, same `createdAt`, merged fields from the form) instead of creating a new one.
4. Change the dialog title: show "Editar activo" when editing, "Nuevo activo" when creating.
5. After submit, if editing, ensure the dialog closes and resets.

The submit flow when editing should look like:
```typescript
const updatedAsset: Asset = {
  ...editAsset,
  type,
  name,
  country: country || undefined,
  year: year ? Number(year) : undefined,
  weight: Number(weight),
  weightUnit,
  purity: Number(purity),
  cost: Number(cost),
  purchaseDate,
}
onSave(updatedAsset)
```

**Verify**: `npx tsc -b` → exit 0

### Step 5: Wire editing into App.tsx

In `src/App.tsx`:

1. Add state for the asset being edited:
```typescript
const [editAsset, setEditAsset] = useState<Asset | null>(null)
const [editOpen, setEditOpen] = useState(false)
```

2. Create an edit handler:
```typescript
function handleEditAsset(asset: Asset) {
  setEditAsset(asset)
  setEditOpen(true)
}
```

3. Modify `handleSaveAsset` to handle both create and update:
```typescript
function handleSaveAsset(asset: Asset) {
  if (editAsset) {
    updateAsset(asset.id, asset)
    setAssets(getAssets())
    setEditAsset(null)
  } else {
    saveAsset(asset)
    setAssets((prev) => [...prev, asset])
  }
}
```

4. Pass `onEdit={handleEditAsset}` to `AssetTable`.
5. Add the edit dialog alongside the add dialog:
```typescript
<AddAssetDialog
  open={editOpen}
  onOpenChange={(open) => { setEditOpen(open); if (!open) setEditAsset(null) }}
  onSave={handleSaveAsset}
  editAsset={editAsset}
/>
```

**Verify**: `npx tsc -b` → exit 0

### Step 6: Update tests

Update the affected test files:

**`src/components/AssetTable.test.tsx`**: Add a test that clicking "Editar" calls `onEdit` with the correct asset. Add `onEdit={vi.fn()}` to existing renders (the button is conditionally rendered only when `onEdit` is provided).

**`src/components/AddAssetDialog.test.tsx`**: Add tests for edit mode:
1. Pre-fills fields from `editAsset` prop.
2. Calls `onSave` with the same ID as the edited asset.
3. Shows "Editar activo" as title.

### Step 7: Verify everything

**Verify**: `npm test` → all tests pass
**Verify**: `npm run lint` → exit 0
**Verify**: `npm run build` → exit 0

## Test plan

| File | New tests | What it covers |
|------|-----------|----------------|
| `src/lib/storage.test.ts` | 3 | `updateAsset` — updates field, no-op for missing ID, partial update |
| `src/components/AssetTable.test.tsx` | 1+ | Edit button renders and calls onEdit with correct asset |
| `src/components/AddAssetDialog.test.tsx` | 3+ | Edit mode pre-fill, same-ID on submission, edit title |

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` exits 0, all tests pass (including new tests)
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `updateAsset` exists in `src/lib/storage.ts`
- [ ] AssetTable shows "Editar" button per row (when `onEdit` is provided)
- [ ] AddAssetDialog pre-fills fields when `editAsset` is provided
- [ ] AddAssetDialog uses same asset ID on edit submit
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- `AddAssetDialog`'s reset logic conflicts with the pre-fill for editing (the `reset()` function clears all fields — ensure editing doesn't call `reset()` before pre-filling).
- The `editAsset` prop requires adding a `data-testid` to the component to test pre-fill — use `getByDisplayValue` instead.
- Migration concerns: existing saved assets have no `updatedAt` field (none is needed — this plan keeps the existing schema).

## Maintenance notes

- The `updateAsset` function uses `Partial<Omit<Asset, "id" | "createdAt">>` which means id and createdAt are immutable after creation. This matches the domain behavior.
- Future plans may want to add an `updatedAt` timestamp to assets — that would need a migration path for existing data.
- The edit dialog reuses `AddAssetDialog` rather than creating a separate component. If the form grows significantly different for edit vs create (e.g., showing historical P&L during edit), extract a shared `AssetForm` component.