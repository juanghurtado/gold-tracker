import type { Asset, MetalPrice } from "../types"
import { calculateSpotEurPerOz, assetPnL } from "../lib/calculations"
import { Button } from "./ui/Button"

const assetTypeLabel: Record<string, string> = {
  coin: "Moneda",
  bar: "Lingote",
}

const mono = "font-[family-name:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace]"

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
      <div className="rounded-[var(--radius-lg)] border border-border bg-card">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="text-sm font-medium text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
            No hay activos en tu cartera
          </div>
          <div className="text-xs text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
            Añade tu primera moneda o lingote para empezar a seguir tu inversión.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-[hsl(36,3%,93%)]/50 dark:bg-[hsl(36,3%,16%)]/50">
            <th className={`${mono} px-4 py-3 text-left text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              Nombre
            </th>
            <th className={`${mono} px-4 py-3 text-left text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              Tipo
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              Peso
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              Pureza
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              Coste
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              Valor actual
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]`}>
              P&L
            </th>
            <th className="px-4 py-3 text-right">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(36,4%,89%)] dark:divide-[hsl(36,3%,19%)]">
          {assets.map((asset) => {
            const { pnl, pnlPercent } = assetPnL(asset, spotEurPerOz)
            const currentValue = pnl + asset.cost
            const isPositive = pnl >= 0
            const isNegative = pnl < 0

            return (
              <tr
                key={asset.id}
                className="transition-colors hover:bg-[hsl(36,3%,93%)]/50 dark:hover:bg-[hsl(36,3%,16%)]/50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-[hsl(36,4%,8%)] dark:text-[hsl(42,3%,93%)]">
                    {asset.name}
                  </div>
                  {asset.country && (
                    <div className="text-xs text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
                      {asset.country}
                      {asset.year && (
                        <>
                          {" · "}
                          <time dateTime={asset.year.toString()}>
                            {asset.year}
                          </time>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
                    {assetTypeLabel[asset.type]}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[hsl(36,4%,8%)] dark:text-[hsl(42,3%,93%)] ${mono}`}>
                  {asset.weight}{" "}
                  <span className="text-xs text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
                    {asset.weightUnit === "ozt" ? "oz t" : "g"}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[hsl(36,4%,8%)] dark:text-[hsl(42,3%,93%)] ${mono}`}>
                  {asset.purity}%
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[hsl(36,4%,8%)] dark:text-[hsl(42,3%,93%)] ${mono}`}>
                  {asset.cost.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-[hsl(36,4%,8%)] dark:text-[hsl(42,3%,93%)] ${mono}`}>
                  {metalPrice
                    ? currentValue.toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })
                    : "—"}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${mono}`}>
                  {metalPrice ? (
                    <>
                      <div className={
                        isPositive
                          ? "text-[hsl(145,42%,30%)] dark:text-[hsl(145,40%,38%)]"
                          : isNegative
                            ? "text-[hsl(5,63%,42%)] dark:text-[hsl(0,63%,52%)]"
                            : "text-[hsl(36,4%,8%)] dark:text-[hsl(42,3%,93%)]"
                      }>
                        {isPositive ? "+" : ""}
                        {pnl.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                      <div className={`text-xs ${
                        isPositive
                          ? "text-[hsl(145,42%,30%)] dark:text-[hsl(145,40%,38%)]"
                          : isNegative
                            ? "text-[hsl(5,63%,42%)] dark:text-[hsl(0,63%,52%)]"
                            : "text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]"
                      }`}>
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
                      className="text-[hsl(5,63%,42%)] hover:text-[hsl(5,63%,37%)] dark:text-[hsl(0,63%,52%)] dark:hover:text-[hsl(0,63%,47%)]"
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
