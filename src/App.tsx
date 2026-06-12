import { useState, useEffect } from "react"
import type { Asset, MetalPrice } from "./types"
import { getAssets, saveAsset, deleteAsset, getApiKey, saveApiKey } from "./lib/storage"
import { fetchMetalPrice, getCachedMetalPrice } from "./lib/api"
import { Dashboard } from "./components/Dashboard"
import { AssetTable } from "./components/AssetTable"
import { AddAssetDialog } from "./components/AddAssetDialog"
import { SettingsDialog } from "./components/SettingsDialog"
import { Button } from "./components/ui/Button"

export default function App() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [metalPrice, setMetalPrice] = useState<MetalPrice | null>(null)
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAssets(getAssets())
    const key = getApiKey()
    setApiKeyState(key)
    const cached = getCachedMetalPrice()
    if (cached) {
      setMetalPrice(cached)
    }
    if (key) {
      refreshPrice(key)
    }
  }, [])

  let abortController: AbortController | null = null

  async function refreshPrice(key?: string) {
    const k = key ?? apiKey
    if (!k) return

    abortController?.abort()
    abortController = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const price = await fetchMetalPrice(abortController.signal)
      setMetalPrice(price)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "Error al obtener precio")
    } finally {
      setLoading(false)
      abortController = null
    }
  }

  function handleSaveAsset(asset: Asset) {
    saveAsset(asset)
    setAssets(getAssets())
  }

  function handleDeleteAsset(id: string) {
    deleteAsset(id)
    setAssets(getAssets())
  }

  function handleSaveApiKey(key: string) {
    saveApiKey(key)
    setApiKeyState(key)
    refreshPrice(key)
  }

  return (
    <div className="min-h-screen bg-background">
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
                <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
                  API Key
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
        />
      </main>

      <AddAssetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleSaveAsset}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        existingKey={apiKey}
        onSave={handleSaveApiKey}
      />
    </div>
  )
}