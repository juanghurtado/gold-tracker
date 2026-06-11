import type { Asset, MetalPrice } from "../types"

const ASSETS_KEY = "gold-tracker:assets"
const API_KEY_KEY = "gold-tracker:api-key"
const METAL_PRICE_KEY = "gold-tracker:metal-price"

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// Assets
export function getAssets(): Asset[] {
  return getItem<Asset[]>(ASSETS_KEY, [])
}

export function saveAsset(asset: Asset): void {
  const assets = getAssets()
  assets.push(asset)
  setItem(ASSETS_KEY, assets)
}

export function updateAsset(asset: Asset): void {
  const assets = getAssets().map((a) => (a.id === asset.id ? asset : a))
  setItem(ASSETS_KEY, assets)
}

export function deleteAsset(id: string): void {
  const assets = getAssets().filter((a) => a.id !== id)
  setItem(ASSETS_KEY, assets)
}

// API key
export function getApiKey(): string | null {
  return getItem<string | null>(API_KEY_KEY, null)
}

export function saveApiKey(key: string): void {
  setItem(API_KEY_KEY, key)
}

// Metal price
export function getMetalPrice(): MetalPrice | null {
  return getItem<MetalPrice | null>(METAL_PRICE_KEY, null)
}

export function saveMetalPrice(price: MetalPrice): void {
  setItem(METAL_PRICE_KEY, price)
}