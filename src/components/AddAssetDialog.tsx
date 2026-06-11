import { useState } from "react"
import type { Asset, AssetType } from "../types"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Label } from "./ui/Label"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/Dialog"

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (asset: Asset) => void
}

export function AddAssetDialog({
  open,
  onOpenChange,
  onSave,
}: AddAssetDialogProps) {
  const [type, setType] = useState<AssetType>("coin")
  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [year, setYear] = useState("")
  const [weight, setWeight] = useState("")
  const [weightUnit, setWeightUnit] = useState<"ozt" | "g">("ozt")
  const [purity, setPurity] = useState("")
  const [cost, setCost] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  function reset() {
    setType("coin")
    setName("")
    setCountry("")
    setYear("")
    setWeight("")
    setWeightUnit("ozt")
    setPurity("")
    setCost("")
    setPurchaseDate(new Date().toISOString().split("T")[0])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const asset: Asset = {
      id: crypto.randomUUID(),
      type,
      name,
      country: country || undefined,
      year: year ? Number(year) : undefined,
      weight: Number(weight),
      weightUnit,
      purity: Number(purity),
      cost: Number(cost),
      purchaseDate,
      createdAt: new Date().toISOString(),
    }

    onSave(asset)
    reset()
    onOpenChange(false)
  }

  const isValid =
    name &&
    weight &&
    purity &&
    cost &&
    purchaseDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Nuevo activo</DialogTitle>
        <DialogDescription>
          Añade una moneda o lingote a tu cartera.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === "coin" ? "default" : "outline"}
            onClick={() => setType("coin")}
            className="flex-1"
          >
            Moneda
          </Button>
          <Button
            type="button"
            variant={type === "bar" ? "default" : "outline"}
            onClick={() => setType("bar")}
            className="flex-1"
          >
            Lingote
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre / designación</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Krugerrand 1 oz"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Sudáfrica"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso</Label>
            <Input
              id="weight"
              type="number"
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weightUnit">Unidad</Label>
            <select
              id="weightUnit"
              value={weightUnit}
              onChange={(e) =>
                setWeightUnit(e.target.value as "ozt" | "g")
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="ozt">oz</option>
              <option value="g">g</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purity">Pureza (%)</Label>
            <Input
              id="purity"
              type="number"
              step="any"
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              placeholder="99.99"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost">Coste (EUR)</Label>
            <Input
              id="cost"
              type="number"
              step="any"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="2100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Fecha compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!isValid}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}