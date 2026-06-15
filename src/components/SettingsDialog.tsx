import { useState } from "react"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Label } from "./ui/Label"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/Dialog"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingKey: string | null
  onSave: (key: string) => void
  onExport?: () => void
  onImport?: (file: File) => void
  autoRefreshInterval?: number
  onSaveAutoRefresh?: (minutes: number) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  existingKey,
  onSave,
  onExport,
  onImport,
  autoRefreshInterval,
  onSaveAutoRefresh,
}: SettingsDialogProps) {
  const [apiKey, setApiKey] = useState(existingKey ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (apiKey.trim()) {
      onSave(apiKey.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Configuración</DialogTitle>
        <DialogDescription>
          Introduce tu API key de{" "}
          <a
            href="https://metalpriceapi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            metalpriceapi.com
          </a>
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ingresa tu API key"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!apiKey.trim()}>
            Guardar
          </Button>
        </div>
      </form>

      {onExport && onImport && (
        <div className="border-t pt-4 mt-4">
          <Label className="text-sm font-medium">Datos</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Exporta o importa tu cartera como archivo JSON.
          </p>
          <p className="text-xs text-amber-600 mb-2">
            Importar reemplazará todos los datos actuales.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onExport}>
              Exportar datos
            </Button>
            <Button type="button" variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
              Importar datos
            </Button>
          </div>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ""
            }}
          />
        </div>
      )}

      {onSaveAutoRefresh !== undefined && (
        <div className="border-t pt-4 mt-4">
          <Label className="text-sm font-medium">Actualización automática</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Actualiza el precio del oro automáticamente cada cierto tiempo.
          </p>
          <select
            value={autoRefreshInterval ?? 0}
            onChange={(e) => onSaveAutoRefresh(Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={0}>Desactivado</option>
            <option value={5}>Cada 5 minutos</option>
            <option value={10}>Cada 10 minutos</option>
            <option value={15}>Cada 15 minutos</option>
            <option value={30}>Cada 30 minutos</option>
            <option value={60}>Cada 1 hora</option>
          </select>
        </div>
      )}
    </Dialog>
  )
}