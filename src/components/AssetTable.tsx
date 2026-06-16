import type { Asset, MetalPrice } from "../types"
import { calculateSpotEurPerOz, assetPnL } from "../lib/calculations"
import { Button } from "./ui/Button"

const assetTypeLabel: Record<string, string> = {
  coin: "Moneda",
  bar: "Lingote",
}

interface AssetTableProps {
  assets: Asset[]
  metalPrice: MetalPrice | null
  onDelete: (id: string) => void
  onEdit?: (asset: Asset) => void
}

export function AssetTable({
  assets,
  metalPrice,
  onDelete,
  onEdit,
}: AssetTableProps) {
  const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0

  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="text-sm font-medium text-muted-foreground">
            No hay activos en tu cartera
          </div>
          <div className="text-xs text-muted-foreground">
            Añade tu primera moneda o lingote para empezar a seguir tu inversión.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tipo
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Peso
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pureza
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Coste
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Valor actual
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              P&L
            </th>
            <th className="px-4 py-3 text-right">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assets.map((asset) => {
            const { pnl, pnlPercent } = assetPnL(asset, spotEurPerOz)
            const currentValue = pnl + asset.cost
            const isPositive = pnl >= 0
            const isNegative = pnl < 0

            return (
              <tr
                key={asset.id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {asset.name}
                  </div>
                  {asset.country && (
                    <div className="text-xs text-muted-foreground">
                      {asset.country}
                      {asset.year && (
                        <>
                          {" "}·{" "}
                          <time dateTime={asset.year.toString()}>
                            {asset.year}
                          </time>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {assetTypeLabel[asset.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {asset.weight}{" "}
                  <span className="text-xs text-muted-foreground">
                    {asset.weightUnit === "ozt" ? "oz t" : "g"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {asset.purity}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {asset.cost.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {metalPrice
                    ? currentValue.toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })
                    : "—"}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    isPositive
                      ? "text-secondary"
                      : isNegative
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {metalPrice ? (
                    <>
                      <div>
                        {isPositive ? "+" : ""}
                        {pnl.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                      <div className="text-xs opacity-80">
                        {isPositive ? "+" : ""}
                        {pnlPercent.toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(asset)}
                      >
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(asset.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
