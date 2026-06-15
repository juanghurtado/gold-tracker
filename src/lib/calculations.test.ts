import { describe, it, expect } from "vitest"
import { weightToOzt, fineOzt, currentValue, calculateSpotEurPerOz, assetPnL, portfolioPnL } from "./calculations"
import type { Asset, MetalPrice } from "../types"

describe("weightToOzt", () => {
  it("returns same value when unit is ozt", () => {
    expect(weightToOzt(1, "ozt")).toBe(1)
  })

  it("divides by 31.1035 when unit is g", () => {
    expect(weightToOzt(31.1035, "g")).toBeCloseTo(1, 4)
  })

  it("handles zero weight", () => {
    expect(weightToOzt(0, "g")).toBe(0)
    expect(weightToOzt(0, "ozt")).toBe(0)
  })

  it("handles very small values", () => {
    expect(weightToOzt(0.001, "g")).toBeCloseTo(0.00003215, 4)
  })
})

describe("fineOzt", () => {
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

  it("calculates fine ounces for a standard asset", () => {
    expect(fineOzt(asset)).toBeCloseTo(0.9167, 4)
  })

  it("returns 0 when purity is 0", () => {
    expect(fineOzt({ ...asset, purity: 0 })).toBe(0)
  })

  it("returns full weight when purity is 100", () => {
    expect(fineOzt({ ...asset, purity: 100 })).toBe(1)
  })

  it("converts grams to ozt before calculating fine ounces", () => {
    expect(fineOzt({ ...asset, weight: 31.1035, weightUnit: "g" })).toBeCloseTo(0.9167, 4)
  })
})

describe("currentValue", () => {
  const asset: Asset = {
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

  it("multiplies fine ounces by spot price", () => {
    expect(currentValue(asset, 2500)).toBe(2500)
  })

  it("returns 0 when spot price is 0", () => {
    expect(currentValue(asset, 0)).toBe(0)
  })

  it("returns 0 when fine ounces is 0", () => {
    expect(currentValue({ ...asset, purity: 0 }, 2500)).toBe(0)
  })
})

describe("calculateSpotEurPerOz", () => {
  it("multiplies XAU/USD by EUR/USD", () => {
    const price: MetalPrice = { xauUsd: 2000, eurPerUsd: 0.92, timestamp: 1 }
    expect(calculateSpotEurPerOz(price)).toBeCloseTo(1840, 2)
  })

  it("returns 0 when XAU/USD is 0", () => {
    const price: MetalPrice = { xauUsd: 0, eurPerUsd: 0.92, timestamp: 1 }
    expect(calculateSpotEurPerOz(price)).toBe(0)
  })

  it("returns 0 when EUR/USD is 0", () => {
    const price: MetalPrice = { xauUsd: 2000, eurPerUsd: 0, timestamp: 1 }
    expect(calculateSpotEurPerOz(price)).toBe(0)
  })
})

describe("assetPnL", () => {
  const baseAsset: Asset = {
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

  it("calculates profit correctly", () => {
    const result = assetPnL(baseAsset, 2500)
    expect(result.pnl).toBe(500)
    expect(result.pnlPercent).toBeCloseTo(25, 2)
  })

  it("calculates loss correctly", () => {
    const result = assetPnL(baseAsset, 1500)
    expect(result.pnl).toBe(-500)
    expect(result.pnlPercent).toBeCloseTo(-25, 2)
  })

  it("returns break-even when spot equals cost", () => {
    const result = assetPnL(baseAsset, 2000)
    expect(result.pnl).toBe(0)
    expect(result.pnlPercent).toBe(0)
  })

  it("returns 0 pnlPercent when cost is 0", () => {
    const result = assetPnL({ ...baseAsset, cost: 0 }, 2500)
    expect(result.pnl).toBe(2500)
    expect(result.pnlPercent).toBe(0)
  })
})

describe("portfolioPnL", () => {
  const asset1: Asset = {
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

  const asset2: Asset = {
    id: "2",
    type: "bar",
    name: "Gold Bar 100g",
    weight: 100,
    weightUnit: "g",
    purity: 99.99,
    cost: 6000,
    purchaseDate: "2024-06-01",
    createdAt: "2024-06-01T00:00:00.000Z",
  }

  it("returns all zeros for empty portfolio", () => {
    const result = portfolioPnL([], 2500)
    expect(result.totalCost).toBe(0)
    expect(result.totalValue).toBe(0)
    expect(result.pnl).toBe(0)
    expect(result.pnlPercent).toBe(0)
  })

  it("calculates for a single asset", () => {
    const result = portfolioPnL([asset1], 2500)
    expect(result.totalCost).toBe(2000)
    expect(result.totalValue).toBe(2500)
    expect(result.pnl).toBe(500)
    expect(result.pnlPercent).toBeCloseTo(25, 2)
  })

  it("calculates for multiple assets", () => {
    const result = portfolioPnL([asset1, asset2], 2500)
    const expectedValue2 = (100 / 31.1035) * (99.99 / 100) * 2500
    expect(result.totalCost).toBeCloseTo(8000, 2)
    expect(result.totalValue).toBeCloseTo(2500 + expectedValue2, 2)
  })

  it("handles zero-cost asset in portfolio", () => {
    const zeroCostAsset: Asset = { ...asset1, cost: 0 }
    const result = portfolioPnL([zeroCostAsset], 2500)
    expect(result.totalCost).toBe(0)
    expect(result.totalValue).toBe(2500)
    expect(result.pnl).toBe(2500)
    expect(result.pnlPercent).toBe(0)
  })
})