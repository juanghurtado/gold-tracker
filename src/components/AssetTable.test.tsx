import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AssetTable } from "./AssetTable"
import type { Asset, MetalPrice } from "../types"

const asset: Asset = {
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

const metalPrice: MetalPrice = { xauUsd: 2000, eurPerUsd: 0.92, timestamp: 1 }

describe("AssetTable", () => {
  it("shows empty state when no assets", () => {
    render(<AssetTable assets={[]} metalPrice={null} onDelete={vi.fn()} />)
    expect(screen.getByText("No hay activos en tu cartera")).toBeInTheDocument()
  })

  it("displays asset details", () => {
    render(<AssetTable assets={[asset]} metalPrice={metalPrice} onDelete={vi.fn()} />)
    expect(screen.getByText("Krugerrand 1 oz")).toBeInTheDocument()
    expect(screen.getByText("Moneda")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("oz")).toBeInTheDocument()
    expect(screen.getByText("91.67%")).toBeInTheDocument()
    expect(screen.getByText(/2000,00/)).toBeInTheDocument()
  })

  it("shows placeholder when metalPrice is null", () => {
    render(<AssetTable assets={[asset]} metalPrice={null} onDelete={vi.fn()} />)
    const dashes = screen.getAllByText("—")
    expect(dashes.length).toBe(2)
  })

  it("calls onDelete with the correct id when clicking Eliminar", async () => {
    const onDelete = vi.fn()
    render(<AssetTable assets={[asset]} metalPrice={metalPrice} onDelete={onDelete} />)
    const user = userEvent.setup()
    await user.click(screen.getByLabelText("Eliminar"))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith("1")
  })

  it("shows edit button and calls onEdit when clicked", async () => {
    const onEdit = vi.fn()
    render(<AssetTable assets={[asset]} metalPrice={metalPrice} onDelete={vi.fn()} onEdit={onEdit} />)
    expect(screen.getByLabelText("Editar")).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText("Editar"))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(asset)
  })
})