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

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assets.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Coste total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalCost.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valor actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalValue.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
          {metalPrice && (
            <p className="text-xs text-muted-foreground">
              Spot: {spotEurPerOz.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              / oz · {timeAgo(metalPrice.timestamp)}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              pnl >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {pnl.toLocaleString("es-ES", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
          <p
            className={`text-xs ${
              pnl >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {pnlPercent >= 0 ? "+" : ""}
            {pnlPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}