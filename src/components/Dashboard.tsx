import type { Asset, MetalPrice } from "../types"
import { calculateSpotEurPerOz } from "../lib/api"
import { currentValue } from "../lib/calculations"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"

interface DashboardProps {
  assets: Asset[]
  metalPrice: MetalPrice | null
}

export function Dashboard({ assets, metalPrice }: DashboardProps) {
  const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
  const totalCost = assets.reduce((sum, a) => sum + a.cost, 0)
  const totalValue = assets.reduce(
    (sum, a) => sum + currentValue(a, spotEurPerOz),
    0
  )
  const pnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0

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
              / oz
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