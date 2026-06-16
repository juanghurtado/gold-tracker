import { useState } from "react"
import type { Asset, AssetType } from "../types"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Label } from "./ui/Label"
import { Select } from "./ui/Select"
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
  editAsset?: Asset
}

export function AddAssetDialog({
  open,
  onOpenChange,
  onSave,
  editAsset,
}: AddAssetDialogProps) {
  const [type, setType] = useState<AssetType>(editAsset?.type ?? "coin")
  const [name, setName] = useState(editAsset?.name ?? "")
  const [country, setCountry] = useState(editAsset?.country ?? "")
  const [year, setYear] = useState(editAsset?.year?.toString() ?? "")
  const [weight, setWeight] = useState(editAsset?.weight.toString() ?? "")
  const [weightUnit, setWeightUnit] = useState<"ozt" | "g">(editAsset?.weightUnit ?? "ozt")
  const [purity, setPurity] = useState(editAsset?.purity.toString() ?? "")
  const [cost, setCost] = useState(editAsset?.cost.toString() ?? "")
  const [purchaseDate, setPurchaseDate] = useState(
    editAsset?.purchaseDate ?? new Date().toISOString().split("T")[0]
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

    const baseAsset = {
      type,
      name,
      country: country || undefined,
      year: year ? Number(year) : undefined,
      weight: Number(weight),
      weightUnit,
      purity: Number(purity),
      cost: Number(cost),
      purchaseDate,
    }

    const asset: Asset = editAsset
      ? { ...editAsset, ...baseAsset }
      : {
          ...baseAsset,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }

    onSave(asset)
    reset()
    onOpenChange(false)
  }

  const weightNum = Number(weight)
  const purityNum = Number(purity)
  const costNum = Number(cost)
  const isValid =
    name.trim() !== "" &&
    weight !== "" && weightNum > 0 &&
    purity !== "" && purityNum > 0 && purityNum <= 100 &&
    cost !== "" && costNum > 0 &&
    purchaseDate !== ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{editAsset ? "Editar activo" : "Nuevo activo"}</DialogTitle>
        <DialogDescription>
          {editAsset ? "Modifica los datos del activo." : "Añade una moneda o lingote a tu cartera."}
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
            <Select
              id="weightUnit"
              value={weightUnit}
              onChange={(e) =>
                setWeightUnit(e.target.value as "ozt" | "g")
              }
            >
              <option value="ozt">oz</option>
              <option value="g">g</option>
            </Select>
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