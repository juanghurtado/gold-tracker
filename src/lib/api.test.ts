import { describe, it, expect, beforeEach, vi } from "vitest"
import { fetchMetalPrice } from "./api"
import { saveApiKey } from "./storage"

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

function mockFetch(response: Response) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response)
}

function mockFetchError(error: Error) {
  return vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(error)
}

describe("fetchMetalPrice", () => {
  it("returns parsed MetalPrice on successful response", async () => {
    saveApiKey("valid-key")
    mockFetch(new Response(JSON.stringify({ success: true, rates: { XAU: 0.0005, EUR: 0.92 } })))
    const result = await fetchMetalPrice()
    expect(result.xauUsd).toBe(2000)
    expect(result.eurPerUsd).toBe(0.92)
    expect(typeof result.timestamp).toBe("number")
  })

  it("throws on API error (non-200)", async () => {
    saveApiKey("valid-key")
    mockFetch(new Response(null, { status: 401, statusText: "Unauthorized" }))
    await expect(fetchMetalPrice()).rejects.toThrow("Metal price API error: 401 Unauthorized")
  })

  it("throws on API error (bad data shape)", async () => {
    saveApiKey("valid-key")
    mockFetch(new Response(JSON.stringify({ success: false, error: "Invalid API key" })))
    await expect(fetchMetalPrice()).rejects.toThrow("Metal price API error: Invalid API key")
  })

  it("throws when rates are missing", async () => {
    saveApiKey("valid-key")
    mockFetch(new Response(JSON.stringify({ success: true, rates: {} })))
    await expect(fetchMetalPrice()).rejects.toThrow("Metal price API error: Metal price API returned an unexpected response")
  })

  it("propagates AbortError", async () => {
    saveApiKey("valid-key")
    const abortError = new DOMException("The operation was aborted", "AbortError")
    mockFetchError(abortError)
    await expect(fetchMetalPrice()).rejects.toThrow("The operation was aborted")
  })

  it("throws when no API key is configured", async () => {
    await expect(fetchMetalPrice()).rejects.toThrow("API key not configured")
  })
})