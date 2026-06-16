import type { Asset, MetalPrice } from "../types"
import { calculateSpotEurPerOz, portfolioPnL } from "../lib/calculations"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "Actualizado hace unos segundos"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Actualizado hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `Actualizado hace ${hours}h`
}

interface DashboardProps {
  assets: Asset[]
  metalPrice: MetalPrice | null
}

export function Dashboard({ assets, metalPrice }: DashboardProps) {
  const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
  const { totalCost, totalValue, pnl, pnlPercent } = portfolioPnL(assets, spotEurPerOz)

  const isPositive = pnl >= 0
  const isNegative = pnl < 0

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="border-gold-border bg-gold-surface">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground">
            Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tighter" style={{ color: "hsl(42, 55%, 43%)" }}>
            {assets.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground">
            Coste total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold tabular-nums tracking-tight">
            {totalCost.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground">
            Valor actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold tabular-nums tracking-tight">
            {totalValue.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          {metalPrice && (
            <p className="mt-1 text-[0.75rem] text-muted-foreground tabular-nums">
              Spot: {spotEurPerOz.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} / oz · {timeAgo(metalPrice.timestamp)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground">
            Beneficio / Pérdida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-extrabold tabular-nums tracking-tight ${
            isPositive
              ? "text-secondary dark:text-secondary"
              : isNegative
                ? "text-destructive dark:text-destructive"
                : ""
          }`}>
            {isPositive ? "+" : ""}
            {pnl.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${
            isPositive
              ? "text-secondary dark:text-secondary"
              : isNegative
                ? "text-destructive dark:text-destructive"
                : "text-muted-foreground"
          }`}>
            {isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}