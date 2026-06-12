import type { MetalPrice } from "../types"
import { getApiKey, saveMetalPrice, getMetalPrice } from "./storage"

const API_BASE = "https://api.metalpriceapi.com/v1"

export async function fetchMetalPrice(signal?: AbortSignal): Promise<MetalPrice> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("API key not configured")
  }

  const res = await fetch(
    `${API_BASE}/latest?api_key=${apiKey}&base=USD&currencies=XAU,EUR`,
    { signal }
  )

  if (!res.ok) {
    throw new Error(`Metal price API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (!data.success || !data.rates?.XAU || !data.rates?.EUR) {
    const errorMsg = data.error || "Metal price API returned an unexpected response"
    throw new Error(`Metal price API error: ${errorMsg}`)
  }

  const price: MetalPrice = {
    xauUsd: data.rates.XAU ? 1 / data.rates.XAU : 0,
    eurPerUsd: data.rates.EUR || 0,
    timestamp: Date.now(),
  }

  saveMetalPrice(price)
  return price
}

export function getCachedMetalPrice(): MetalPrice | null {
  return getMetalPrice()
}