import type { MetalPrice } from "../types"
import { getApiKey, saveMetalPrice, getMetalPrice } from "./storage"

const API_BASE = "https://api.metalpriceapi.com/v1"

export async function fetchMetalPrice(): Promise<MetalPrice> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error("API key not configured")
  }

  const res = await fetch(
    `${API_BASE}/latest?api_key=${apiKey}&base=USD&currencies=XAU,EUR`
  )

  if (!res.ok) {
    throw new Error(`Metal price API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  const price: MetalPrice = {
    xauUsd: data.rates.XAU ? 1 / data.rates.XAU : 0,
    eurUsd: data.rates.EUR || 0,
    timestamp: Date.now(),
  }

  saveMetalPrice(price)
  return price
}

export function getCachedMetalPrice(): MetalPrice | null {
  return getMetalPrice()
}

export function calculateSpotEurPerOz(price: MetalPrice): number {
  return price.xauUsd / price.eurUsd
}