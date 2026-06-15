import { describe, it, expect, beforeEach } from "vitest"
import { getAssets, saveAsset, deleteAsset, updateAsset, getApiKey, saveApiKey, getMetalPrice, saveMetalPrice, clearAppData, exportAllData, importAllData, getAutoRefreshInterval, saveAutoRefreshInterval } from "./storage"
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

describe("clearAppData", () => {
  it("removes gold-tracker prefixed keys but leaves other keys intact", () => {
    localStorage.setItem("gold-tracker:assets", JSON.stringify([asset]))
    localStorage.setItem("other-app:data", "keep-me")
    clearAppData()
    expect(localStorage.getItem("gold-tracker:assets")).toBeNull()
    expect(localStorage.getItem("other-app:data")).toBe("keep-me")
  })

  it("does nothing when no app keys exist", () => {
    localStorage.setItem("other-app:data", "keep-me")
    clearAppData()
    expect(localStorage.getItem("other-app:data")).toBe("keep-me")
  })

  it("does not throw when localStorage is empty", () => {
    expect(() => clearAppData()).not.toThrow()
  })
})

describe("updateAsset", () => {
  it("updates an existing field", () => {
    saveAsset(asset)
    saveAsset(asset2)
    updateAsset("1", { name: "Updated Name" })
    const result = getAssets()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("Updated Name")
    expect(result[1].name).toBe("Gold Bar 50g")
  })

  it("returns assets unchanged when ID not found", () => {
    saveAsset(asset)
    updateAsset("nonexistent", { name: "Should Not Apply" })
    expect(getAssets()).toEqual([asset])
  })

  it("only updates specified fields", () => {
    saveAsset(asset)
    updateAsset("1", { cost: 2500 })
    const result = getAssets()
    expect(result[0].cost).toBe(2500)
    expect(result[0].name).toBe("Krugerrand 1 oz")
    expect(result[0].weight).toBe(1)
  })
})

describe("exportAllData / importAllData", () => {
  it("exportAllData returns current state", () => {
    saveAsset(asset)
    saveApiKey("test-key")
    const price: MetalPrice = { xauUsd: 2000, eurPerUsd: 0.92, timestamp: 1718000000000 }
    saveMetalPrice(price)
    const data = exportAllData()
    expect(data.assets).toEqual([asset])
    expect(data.apiKey).toBe("test-key")
    expect(data.metalPrice).toEqual(price)
    expect(data.version).toBe(1)
    expect(data.exportedAt).toBeTruthy()
  })

  it("importAllData restores data", () => {
    const price: MetalPrice = { xauUsd: 3000, eurPerUsd: 0.95, timestamp: 1718000000000 }
    const data = { version: 1, exportedAt: "", assets: [asset, asset2], apiKey: "imported-key", metalPrice: price }
    importAllData(data)
    expect(getAssets()).toEqual([asset, asset2])
    expect(getApiKey()).toBe("imported-key")
    expect(getMetalPrice()).toEqual(price)
  })

  it("importAllData throws on invalid version", () => {
    expect(() => importAllData({ version: 999 } as any)).toThrow("Unsupported data format")
  })

  it("importAllData replaces existing data", () => {
    saveAsset(asset)
    saveApiKey("old-key")
    const newData = { version: 1, exportedAt: "", assets: [asset2], apiKey: "new-key", metalPrice: null }
    importAllData(newData)
    expect(getAssets()).toEqual([asset2])
    expect(getApiKey()).toBe("new-key")
  })
})

describe("getAutoRefreshInterval / saveAutoRefreshInterval", () => {
  it("defaults to 0 when not set", () => {
    expect(getAutoRefreshInterval()).toBe(0)
  })

  it("round-trips a value", () => {
    saveAutoRefreshInterval(15)
    expect(getAutoRefreshInterval()).toBe(15)
  })

  it("overwrites existing value", () => {
    saveAutoRefreshInterval(5)
    saveAutoRefreshInterval(30)
    expect(getAutoRefreshInterval()).toBe(30)
  })
})