import type { Asset, MetalPrice } from "../types"
import { calculateSpotEurPerOz } from "../lib/api"
import { Button } from "./ui/Button"

function weightToOzt(weight: number, unit: "ozt" | "g"): number {
  return unit === "g" ? weight / 31.1035 : weight
}

function fineOzt(asset: Asset): number {
  return weightToOzt(asset.weight, asset.weightUnit) * (asset.purity / 100)
}

function currentValue(asset: Asset, spotEurPerOz: number): number {
  return fineOzt(asset) * spotEurPerOz
}

const assetTypeLabel: Record<string, string> = {
  coin: "Moneda",
  bar: "Lingote",
}

interface AssetTableProps {
  assets: Asset[]
  metalPrice: MetalPrice | null
  onDelete: (id: string) => void
}

export function AssetTable({
  assets,
  metalPrice,
  onDelete,
}: AssetTableProps) {
  const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No hay activos en tu cartera. Añade tu primer activo.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Tipo</th>
            <th className="px-4 py-3 text-right font-medium">Peso</th>
            <th className="px-4 py-3 text-right font-medium">Pureza</th>
            <th className="px-4 py-3 text-right font-medium">Coste</th>
            <th className="px-4 py-3 text-right font-medium">Valor actual</th>
            <th className="px-4 py-3 text-right font-medium">P&L</th>
            <th className="px-4 py-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const value = currentValue(asset, spotEurPerOz)
            const pnl = value - asset.cost
            const pnlPercent = (pnl / asset.cost) * 100

            return (
              <tr key={asset.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[asset.country, asset.year]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {assetTypeLabel[asset.type]}
                </td>
                <td className="px-4 py-3 text-right">
                  {asset.weight} {asset.weightUnit === "ozt" ? "oz" : "g"}
                </td>
                <td className="px-4 py-3 text-right">
                  {asset.purity}%
                </td>
                <td className="px-4 py-3 text-right">
                  {asset.cost.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {metalPrice
                    ? value.toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })
                    : "—"}
                </td>
                <td
                  className={`px-4 py-3 text-right ${
                    pnl >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metalPrice ? (
                    <>
                      <div>
                        {pnl.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                      <div className="text-xs">
                        {pnlPercent >= 0 ? "+" : ""}
                        {pnlPercent.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(asset.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Vender
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}