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
      {/* Activos — gold accent number */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
            Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: "hsl(42, 55%, 53%)" }}>
            {assets.length}
          </div>
        </CardContent>
      </Card>

      {/* Coste total — ink with secondary label */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
            Coste total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums tracking-tight">
            {totalCost.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </CardContent>
      </Card>

      {/* Valor actual — ink with spot price subtitle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
            Valor actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums tracking-tight">
            {totalValue.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          {metalPrice && (
            <p className="mt-1 text-[0.75rem] text-[hsl(36,2%,45%)] tabular-nums dark:text-[hsl(36,2%,58%)]">
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

      {/* P&L — colored value with +/− symbol */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[0.75rem] font-medium uppercase tracking-wider text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]">
            Beneficio / Pérdida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold tabular-nums tracking-tight ${
            isPositive
              ? "text-[hsl(145,42%,30%)] dark:text-[hsl(145,40%,38%)]"
              : isNegative
                ? "text-[hsl(5,63%,42%)] dark:text-[hsl(0,63%,52%)]"
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
          <p className={`mt-1 text-[0.75rem] tabular-nums ${
            isPositive
              ? "text-[hsl(145,42%,30%)] dark:text-[hsl(145,40%,38%)]"
              : isNegative
                ? "text-[hsl(5,63%,42%)] dark:text-[hsl(0,63%,52%)]"
                : "text-[hsl(36,2%,45%)] dark:text-[hsl(36,2%,58%)]"
          }`}>
            {isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
