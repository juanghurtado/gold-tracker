import type { Asset, MetalPrice } from "../types"
import { calculateSpotEurPerOz, assetPnL } from "../lib/calculations"
import { Button } from "./ui/Button"
import { useState } from "react"

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
  newAssetId?: string | null
}

export function AssetTable({
  assets,
  metalPrice,
  onDelete,
  onEdit,
  newAssetId,
}: AssetTableProps) {
  const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
  const [animatingOutIds, setAnimatingOutIds] = useState<Set<string>>(new Set())

  function handleDelete(id: string) {
    setAnimatingOutIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      onDelete(id)
      setAnimatingOutIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 200)
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-card">
        <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="opacity-60"
          >
            <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" className="text-gold-border" />
            <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="1.5" className="text-gold-border" />
            <text
              x="28"
              y="32"
              textAnchor="middle"
              className="fill-gold-spotlight dark:fill-primary"
              fontSize="18"
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
            >
              Au
            </text>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Tu colección está vacía
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Añade tu primera moneda o lingote para empezar a seguir tu inversión en oro.
              Tus datos se guardan localmente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gold-surface">
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
        <tbody className="divide-y divide-border">
          {assets.map((asset) => {
            const { pnl, pnlPercent } = assetPnL(asset, spotEurPerOz)
            const currentValue = pnl + asset.cost
            const isPositive = pnl >= 0
            const isNegative = pnl < 0

            return (
              <tr
                key={asset.id}
                className={`transition-colors hover:bg-gold-surface ${
                  animatingOutIds.has(asset.id) ? "animate-fade-out" : ""
                } ${newAssetId === asset.id ? "animate-scale-in" : ""}`}
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
                      onClick={() => handleDelete(asset.id)}
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