import { getAssets, saveAsset, deleteAsset, getApiKey, saveApiKey, getMetalPrice, saveMetalPrice } from "./storage"
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

const asset2: Asset = {
  id: "2",
  type: "bar",
  name: "Gold Bar 50g",
  weight: 50,
  weightUnit: "g",
  purity: 99.99,
  cost: 3000,
  purchaseDate: "2024-06-01",
  createdAt: "2024-06-01T00:00:00.000Z",
}

beforeEach(() => {
  localStorage.clear()
})

describe("getAssets", () => {
  it("returns empty array when storage is empty", () => {
    expect(getAssets()).toEqual([])
  })

  it("returns empty array on malformed JSON", () => {
    localStorage.setItem("gold-tracker:assets", "not-json")
    expect(getAssets()).toEqual([])
  })

  it("parses stored data correctly", () => {
    saveAsset(asset)
    expect(getAssets()).toEqual([asset])
  })
})

describe("saveAsset", () => {
  it("stores and retrieves one asset", () => {
    saveAsset(asset)
    expect(getAssets()).toHaveLength(1)
    expect(getAssets()[0]).toEqual(asset)
  })

  it("appends multiple assets", () => {
    saveAsset(asset)
    saveAsset(asset2)
    expect(getAssets()).toHaveLength(2)
    expect(getAssets()).toEqual([asset, asset2])
  })
})

describe("deleteAsset", () => {
  it("deletes an existing asset by id", () => {
    saveAsset(asset)
    saveAsset(asset2)
    deleteAsset("1")
    expect(getAssets()).toEqual([asset2])
  })

  it("is a no-op for non-existent id", () => {
    saveAsset(asset)
    deleteAsset("nonexistent")
    expect(getAssets()).toEqual([asset])
  })

  it("returns empty list after deleting the only asset", () => {
    saveAsset(asset)
    deleteAsset("1")
    expect(getAssets()).toEqual([])
  })
})

describe("getApiKey / saveApiKey", () => {
  it("returns null when not set", () => {
    expect(getApiKey()).toBeNull()
  })

  it("round-trips a key", () => {
    saveApiKey("test-key-123")
    expect(getApiKey()).toBe("test-key-123")
  })

  it("overwrites an existing key", () => {
    saveApiKey("first-key")
    saveApiKey("second-key")
    expect(getApiKey()).toBe("second-key")
  })
})

describe("getMetalPrice / saveMetalPrice", () => {
  const price: MetalPrice = { xauUsd: 2000, eurPerUsd: 0.92, timestamp: 1718000000000 }

  it("returns null when not set", () => {
    expect(getMetalPrice()).toBeNull()
  })

  it("round-trips a metal price", () => {
    saveMetalPrice(price)
    expect(getMetalPrice()).toEqual(price)
  })

  it("preserves timestamp", () => {
    saveMetalPrice(price)
    expect(getMetalPrice()?.timestamp).toBe(1718000000000)
  })
})