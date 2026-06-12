import type { Asset } from "../types"

export function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

export function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

export function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}
