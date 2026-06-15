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
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`Failed to write to localStorage key "${key}":`, e)
  }
}

// Assets
export function getAssets(): Asset[] {
  return getItem<Asset[]>(ASSETS_KEY, [])
}

export function saveAsset(asset: Asset): void {
  const assets = [...getAssets(), asset]
  setItem(ASSETS_KEY, assets)
}

export function deleteAsset(id: string): void {
  const assets = getAssets().filter((a) => a.id !== id)
  setItem(ASSETS_KEY, assets)
}

export function updateAsset(id: string, updates: Partial<Omit<Asset, "id" | "createdAt">>): void {
  const assets = getAssets().map((a) =>
    a.id === id ? { ...a, ...updates } : a
  )
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

export function clearAppData(): void {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith("gold-tracker:")) {
        localStorage.removeItem(key)
      }
    }
  } catch (e) {
    console.warn("Failed to clear app data:", e)
  }
}

export interface ExportData {
  version: number
  exportedAt: string
  assets: Asset[]
  apiKey: string | null
  metalPrice: MetalPrice | null
}

export function exportAllData(): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    assets: getAssets(),
    apiKey: getApiKey(),
    metalPrice: getMetalPrice(),
  }
}

export function importAllData(data: ExportData): void {
  if (!data || data.version !== 1) {
    throw new Error("Unsupported data format")
  }
  setItem(ASSETS_KEY, data.assets)
  setItem(API_KEY_KEY, data.apiKey ?? "")
  setItem(METAL_PRICE_KEY, data.metalPrice)
}

const AUTO_REFRESH_KEY = "gold-tracker:auto-refresh-interval"

export function getAutoRefreshInterval(): number {
  return getItem<number>(AUTO_REFRESH_KEY, 0)
}

export function saveAutoRefreshInterval(minutes: number): void {
  setItem(AUTO_REFRESH_KEY, minutes)
}
