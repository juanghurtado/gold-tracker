import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AddAssetDialog } from "./AddAssetDialog"
import type { Asset } from "../types"

const existingAsset: Asset = {
  id: "test-id-123",
  type: "coin",
  name: "Krugerrand 1 oz",
  weight: 1,
  weightUnit: "ozt",
  purity: 91.67,
  cost: 2000,
  purchaseDate: "2024-01-15",
  createdAt: "2024-01-15T00:00:00.000Z",
}

function getForm() {
  return screen.getByRole("button", { name: "Guardar" }).closest("form")!
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre / designación"), "Krugerrand 1 oz")
  await user.type(screen.getByLabelText("Peso"), "1")
  await user.type(screen.getByLabelText("Pureza (%)"), "91.67")
  await user.type(screen.getByLabelText("Coste (EUR)"), "2100")
  fireEvent.change(screen.getByLabelText("Fecha compra"), { target: { value: "2024-01-15" } })
}

describe("AddAssetDialog", () => {
  it("renders all form fields when open", () => {
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByText("Nuevo activo")).toBeInTheDocument()
    expect(screen.getByLabelText("Nombre / designación")).toBeInTheDocument()
    expect(screen.getByText("Moneda")).toBeInTheDocument()
    expect(screen.getByText("Lingote")).toBeInTheDocument()
    expect(screen.getByLabelText("País")).toBeInTheDocument()
    expect(screen.getByLabelText("Año")).toBeInTheDocument()
    expect(screen.getByLabelText("Peso")).toBeInTheDocument()
    expect(screen.getByLabelText("Unidad")).toBeInTheDocument()
    expect(screen.getByLabelText("Pureza (%)")).toBeInTheDocument()
    expect(screen.getByLabelText("Coste (EUR)")).toBeInTheDocument()
    expect(screen.getByLabelText("Fecha compra")).toBeInTheDocument()
  })

  it("submit button is disabled when form is empty", () => {
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("submit button is disabled with invalid purity", async () => {
    const user = userEvent.setup()
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    await user.type(screen.getByLabelText("Nombre / designación"), "Test")
    await user.type(screen.getByLabelText("Peso"), "1")
    await user.type(screen.getByLabelText("Pureza (%)"), "999")
    await user.type(screen.getByLabelText("Coste (EUR)"), "100")
    fireEvent.change(screen.getByLabelText("Fecha compra"), { target: { value: "2024-01-15" } })
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("submit button is disabled with zero weight", async () => {
    const user = userEvent.setup()
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    await user.type(screen.getByLabelText("Nombre / designación"), "Test")
    await user.type(screen.getByLabelText("Peso"), "0")
    await user.type(screen.getByLabelText("Pureza (%)"), "99.99")
    await user.type(screen.getByLabelText("Coste (EUR)"), "100")
    fireEvent.change(screen.getByLabelText("Fecha compra"), { target: { value: "2024-01-15" } })
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("calls onSave with correct data on valid submit", async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={onSave} />)
    await fillValidForm(user)
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled()
    fireEvent.submit(getForm())
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Krugerrand 1 oz",
        type: "coin",
        weight: 1,
        weightUnit: "ozt",
        purity: 91.67,
        cost: 2100,
        purchaseDate: "2024-01-15",
      })
    )
  })

  it("toggles between coin and bar types", async () => {
    const user = userEvent.setup()
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    await user.click(screen.getByText("Lingote"))
    await user.click(screen.getByText("Moneda"))
  })

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<AddAssetDialog open={true} onOpenChange={onOpenChange} onSave={vi.fn()} />)
    await user.click(screen.getByText("Cancelar"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("country and year fields are optional", async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={onSave} />)
    await fillValidForm(user)
    fireEvent.submit(getForm())
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        country: undefined,
        year: undefined,
      })
    )
  })

  describe("edit mode", () => {
    it("pre-fills fields from editAsset prop", () => {
      render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} editAsset={existingAsset} />)
      expect(screen.getByDisplayValue("Krugerrand 1 oz")).toBeInTheDocument()
      expect(screen.getByDisplayValue("1")).toBeInTheDocument()
      expect(screen.getByDisplayValue("91.67")).toBeInTheDocument()
      expect(screen.getByDisplayValue("2000")).toBeInTheDocument()
      expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument()
    })

    it("calls onSave with the same ID as the edited asset", () => {
      const onSave = vi.fn()
      render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={onSave} editAsset={existingAsset} />)
      fireEvent.submit(getForm())
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: "test-id-123" })
      )
    })

    it('shows "Editar activo" as title', () => {
      render(<AddAssetDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} editAsset={existingAsset} />)
      expect(screen.getByText("Editar activo")).toBeInTheDocument()
    })
  })
})