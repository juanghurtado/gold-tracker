export type AssetType = "coin" | "bar"

export interface Asset {
  id: string
  type: AssetType
  name: string
  country?: string
  year?: number
  weight: number
  weightUnit: "ozt" | "g"
  purity: number
  cost: number
  purchaseDate: string
  createdAt: string
}

export interface MetalPrice {
  xauUsd: number
  eurPerUsd: number
  timestamp: number
}

export interface AppState {
  assets: Asset[]
  apiKey: string | null
  metalPrice: MetalPrice | null
}