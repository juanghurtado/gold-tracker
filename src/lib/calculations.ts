import type { Asset, MetalPrice } from "../types"

export function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

export function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

export function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}

export function calculateSpotEurPerOz(price: MetalPrice): number {
  return price.xauUsd * price.eurPerUsd
}

export function assetPnL(asset: Asset, spotEurPerOz: number): { pnl: number; pnlPercent: number } {
  const value = currentValue(asset, spotEurPerOz)
  const pnl = value - asset.cost
  const pnlPercent = asset.cost > 0 ? (pnl / asset.cost) * 100 : 0
  return { pnl, pnlPercent }
}

export function portfolioPnL(
  assets: Asset[],
  spotEurPerOz: number
): { totalCost: number; totalValue: number; pnl: number; pnlPercent: number } {
  const totalCost = assets.reduce((sum, a) => sum + a.cost, 0)
  const totalValue = assets.reduce((sum, a) => sum + currentValue(a, spotEurPerOz), 0)
  const pnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  return { totalCost, totalValue, pnl, pnlPercent }
}
