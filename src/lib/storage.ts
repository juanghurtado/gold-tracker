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

function isValidExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  if (d.version !== 1) return false
  if (typeof d.exportedAt !== "string") return false
  if (!Array.isArray(d.assets)) return false
  for (const asset of d.assets) {
    if (!asset || typeof asset !== "object") return false
    const a = asset as Record<string, unknown>
    if (typeof a.id !== "string") return false
    if (a.type !== "coin" && a.type !== "bar") return false
    if (typeof a.name !== "string") return false
    if (typeof a.weight !== "number") return false
    if (a.weightUnit !== "ozt" && a.weightUnit !== "g") return false
    if (typeof a.purity !== "number") return false
    if (typeof a.cost !== "number") return false
    if (typeof a.purchaseDate !== "string") return false
    if (typeof a.createdAt !== "string") return false
  }
  if (d.apiKey !== null && typeof d.apiKey !== "string") return false
  if (d.metalPrice !== null) {
    if (typeof d.metalPrice !== "object") return false
    const mp = d.metalPrice as Record<string, unknown>
    if (typeof mp.xauUsd !== "number") return false
    if (typeof mp.eurPerUsd !== "number") return false
    if (typeof mp.timestamp !== "number") return false
  }
  return true
}

export function importAllData(data: ExportData): void {
  if (!isValidExportData(data)) {
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
