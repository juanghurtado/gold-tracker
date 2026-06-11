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
}

export function SettingsDialog({
  open,
  onOpenChange,
  existingKey,
  onSave,
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
    </Dialog>
  )
}