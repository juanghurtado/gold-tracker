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
      <div className="rounded-[var(--radius-lg)] border-2 border-border bg-card">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="text-sm font-semibold text-muted-foreground">
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
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border-2 border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border bg-gold-surface">
            <th className={`${mono} px-4 py-3 text-left text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              Nombre
            </th>
            <th className={`${mono} px-4 py-3 text-left text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              Tipo
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              Peso
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              Pureza
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              Coste
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              Valor actual
            </th>
            <th className={`${mono} px-4 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground`}>
              P&L
            </th>
            <th className="px-4 py-3 text-right">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-border">
          {assets.map((asset) => {
            const { pnl, pnlPercent } = assetPnL(asset, spotEurPerOz)
            const currentValue = pnl + asset.cost
            const isPositive = pnl >= 0
            const isNegative = pnl < 0

            return (
              <tr
                key={asset.id}
                className="transition-colors hover:bg-gold-surface"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">
                    {asset.name}
                  </div>
                  {asset.country && (
                    <div className="text-xs text-muted-foreground">
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
                  <span className="text-xs font-medium text-muted-foreground">
                    {assetTypeLabel[asset.type]}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-foreground ${mono}`}>
                  {asset.weight}{" "}
                  <span className="text-xs text-muted-foreground">
                    {asset.weightUnit === "ozt" ? "oz" : "g"}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-foreground ${mono}`}>
                  {asset.purity}%
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-foreground ${mono}`}>
                  {asset.cost.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-foreground ${mono}`}>
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
                      <div className={`font-semibold ${
                        isPositive
                          ? "text-secondary dark:text-secondary"
                          : isNegative
                            ? "text-destructive dark:text-destructive"
                            : "text-foreground"
                      }`}>
                        {isPositive ? "+" : ""}
                        {pnl.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                      <div className={`text-xs font-medium ${
                        isPositive
                          ? "text-secondary dark:text-secondary"
                          : isNegative
                            ? "text-destructive dark:text-destructive"
                            : "text-muted-foreground"
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
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive/70 hover:text-destructive"
                      onClick={() => onDelete(asset.id)}
                      aria-label="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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