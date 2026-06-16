import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Dashboard } from "./Dashboard"
import type { Asset, MetalPrice } from "../types"

const pureAsset: Asset = {
  id: "1",
  type: "coin",
  name: "Krugerrand 1 oz",
  weight: 1,
  weightUnit: "ozt",
  purity: 100,
  cost: 2000,
  purchaseDate: "2024-01-15",
  createdAt: "2024-01-15T00:00:00.000Z",
}

const highPrice: MetalPrice = { xauUsd: 3000, eurPerUsd: 0.95, timestamp: 1 }

describe("Dashboard", () => {
  it("renders 0 assets when empty", () => {
    render(<Dashboard assets={[]} metalPrice={null} />)
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("Activos")).toBeInTheDocument()
    expect(screen.getByText("Coste total")).toBeInTheDocument()
    expect(screen.getByText("Valor actual")).toBeInTheDocument()
    expect(screen.getByText("P&L")).toBeInTheDocument()
  })

  it("shows formatted total cost and total value with one asset", () => {
    render(<Dashboard assets={[pureAsset]} metalPrice={highPrice} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText(/2000,00/)).toBeInTheDocument()
    expect(screen.getAllByText(/2850,00/)).toHaveLength(2)
  })

  it("shows positive P&L in green", () => {
    render(<Dashboard assets={[pureAsset]} metalPrice={highPrice} />)
    const value = 1 * (3000 * 0.95)
    const pnl = value - 2000
    const pnlFormatted = pnl.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
    const pnlEl = screen.getByText((content) => content.replace(/\s/g, " ") === pnlFormatted.replace(/\s/g, " "))
    expect(pnlEl.className).toContain("text-green-600")
  })

  it("shows negative P&L in red", () => {
    const lowPrice: MetalPrice = { xauUsd: 1500, eurPerUsd: 0.95, timestamp: 1 }
    render(<Dashboard assets={[pureAsset]} metalPrice={lowPrice} />)
    const value = 1 * (1500 * 0.95)
    const pnl = value - 2000
    const pnlFormatted = pnl.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
    const pnlEl = screen.getByText((content) => content.replace(/\s/g, " ") === pnlFormatted.replace(/\s/g, " "))
    expect(pnlEl.className).toContain("text-red-600")
  })

  describe("timeAgo", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows "unos segundos" when price updated less than 60 seconds ago', () => {
      const recentPrice: MetalPrice = { ...highPrice, timestamp: Date.now() - 30 * 1000 }
      render(<Dashboard assets={[pureAsset]} metalPrice={recentPrice} />)
      expect(screen.getByText(/Actualizado hace unos segundos/)).toBeInTheDocument()
    })

    it('shows "X min" when price updated less than 60 minutes ago', () => {
      const recentPrice: MetalPrice = { ...highPrice, timestamp: Date.now() - 5 * 60 * 1000 }
      render(<Dashboard assets={[pureAsset]} metalPrice={recentPrice} />)
      expect(screen.getByText(/Actualizado hace 5 min/)).toBeInTheDocument()
    })

    it('shows "Xh" when price updated 2 hours ago', () => {
      const oldPrice: MetalPrice = { ...highPrice, timestamp: Date.now() - 2 * 60 * 60 * 1000 }
      render(<Dashboard assets={[pureAsset]} metalPrice={oldPrice} />)
      expect(screen.getByText(/Actualizado hace 2h/)).toBeInTheDocument()
    })
  })
})