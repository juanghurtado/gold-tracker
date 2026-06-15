import { useState, useEffect, useRef } from "react"
import type { Asset, MetalPrice } from "./types"
import { getAssets, saveAsset, deleteAsset, updateAsset, getApiKey, saveApiKey, getMetalPrice, exportAllData, importAllData, getAutoRefreshInterval, saveAutoRefreshInterval } from "./lib/storage"
import { fetchMetalPrice } from "./lib/api"
import { Dashboard } from "./components/Dashboard"
import { AssetTable } from "./components/AssetTable"
import { AddAssetDialog } from "./components/AddAssetDialog"
import { SettingsDialog } from "./components/SettingsDialog"
import { Button } from "./components/ui/Button"
import { ErrorBoundary } from "./components/ErrorBoundary"

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(() => getAssets())
  const [metalPrice, setMetalPrice] = useState<MetalPrice | null>(() => getMetalPrice())
  const [apiKey, setApiKeyState] = useState<string | null>(() => getApiKey())
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => getAutoRefreshInterval())

  const abortControllerRef = useRef<AbortController | null>(null)

  async function refreshPrice(key?: string) {
    const k = key ?? apiKey
    if (!k) return

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const price = await fetchMetalPrice(abortControllerRef.current.signal)
      setMetalPrice(price)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "Error al obtener precio")
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    if (apiKey) {
      const timer = setTimeout(() => refreshPrice(apiKey))
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  useEffect(() => {
    if (!apiKey || autoRefreshInterval <= 0) return

    const intervalId = setInterval(() => refreshPrice(apiKey), autoRefreshInterval * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [apiKey, autoRefreshInterval])

  function handleSaveAsset(asset: Asset) {
    if (editAsset) {
      updateAsset(asset.id, asset)
      setAssets(getAssets())
      setEditAsset(null)
    } else {
      saveAsset(asset)
      setAssets((prev) => [...prev, asset])
    }
  }

  function handleDeleteAsset(id: string) {
    deleteAsset(id)
    setAssets(getAssets())
  }

  function handleEditAsset(asset: Asset) {
    setEditAsset(asset)
    setEditOpen(true)
  }

  function handleSaveApiKey(key: string) {
    saveApiKey(key)
    setApiKeyState(key)
    refreshPrice(key)
  }

  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gold-tracker-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        importAllData(data)
        setAssets(getAssets())
        setApiKeyState(getApiKey())
        setMetalPrice(getMetalPrice())
        setError(null)
        setSuccess("Datos importados correctamente")
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al importar datos")
      }
    }
    reader.readAsText(file)
  }

  function handleSaveAutoRefresh(minutes: number) {
    saveAutoRefreshInterval(minutes)
    setAutoRefreshInterval(minutes)
  }

  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold">Gold Tracker</h1>
            <div className="flex gap-2">
              {!apiKey && (
                <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                  Configurar API
                </Button>
              )}
              {apiKey && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => refreshPrice()}
                    disabled={loading}
                  >
                    {loading ? "Actualizando..." : "Actualizar precios"}
                  </Button>
                  {autoRefreshInterval > 0 && (
                    <span className="text-xs text-muted-foreground self-center">
                      Auto: {autoRefreshInterval} min
                    </span>
                  )}
                  <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
                    Configuración
                  </Button>
                </>
              )}
              <Button onClick={() => setAddOpen(true)}>+ Añadir activo</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {success}
            </div>
          )}

          {!apiKey && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Configura tu API key de metalpriceapi.com para ver los precios del
              oro en tiempo real.
            </div>
          )}

          <Dashboard assets={assets} metalPrice={metalPrice} />

          <AssetTable
            assets={assets}
            metalPrice={metalPrice}
            onDelete={handleDeleteAsset}
            onEdit={handleEditAsset}
          />
        </main>

        <AddAssetDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSave={handleSaveAsset}
        />

        <AddAssetDialog
          open={editOpen}
          key={editAsset?.id ?? "new"}
          onOpenChange={(open) => { setEditOpen(open); if (!open) setEditAsset(null) }}
          onSave={handleSaveAsset}
          editAsset={editAsset ?? undefined}
        />

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          existingKey={apiKey}
          onSave={handleSaveApiKey}
          onExport={handleExport}
          onImport={handleImport}
          autoRefreshInterval={autoRefreshInterval}
          onSaveAutoRefresh={handleSaveAutoRefresh}
        />
      </ErrorBoundary>
    </div>
  )
}
