import { useState, useEffect, useRef } from "react"
import type { Asset, MetalPrice } from "./types"
import { getAssets, saveAsset, deleteAsset, updateAsset, getApiKey, saveApiKey, getMetalPrice, exportAllData, importAllData, getAutoRefreshInterval, saveAutoRefreshInterval } from "./lib/storage"
import { fetchMetalPrice } from "./lib/api"
import { calculateSpotEurPerOz, portfolioPnL } from "./lib/calculations"
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
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("dark-mode") === "true"
    } catch {
      return false
    }
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const [newAssetId, setNewAssetId] = useState<string | null>(null)

  const spotEurPerOz = metalPrice ? calculateSpotEurPerOz(metalPrice) : 0
  const { totalValue } = portfolioPnL(assets, spotEurPerOz)
  const prevPortfolioRef = useRef(0)
  const [milestone, setMilestone] = useState<string | null>(null)

  useEffect(() => {
    if (prevPortfolioRef.current === 0 && totalValue > 0) {
      prevPortfolioRef.current = totalValue
      return
    }
    const thresholds = [10000, 25000, 50000, 100000, 250000, 500000, 1000000]
    for (const t of thresholds) {
      if (prevPortfolioRef.current < t && totalValue >= t) {
        setMilestone(`¡Cartera supera los ${t.toLocaleString("es-ES")} €!`)
        setTimeout(() => setMilestone(null), 4000)
        break
      }
    }
    prevPortfolioRef.current = totalValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalValue])

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    try {
      localStorage.setItem("dark-mode", String(dark))
    } catch {
      // storage full or unavailable
    }
  }, [dark])

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
      setNewAssetId(asset.id)
      setTimeout(() => setNewAssetId(null), 300)
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
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <h1 className="shimmer-text text-2xl font-extrabold tracking-tighter text-primary">
              Gold Tracker
            </h1>
            <div className="flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDark((d) => !d)}
                className="text-muted-foreground"
                aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {dark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          {milestone && (
            <div className="animate-slide-in rounded-[var(--radius-lg)] border border-primary/60 bg-primary/10 p-4 text-sm font-medium text-primary text-center">
              {milestone}
            </div>
          )}

          {error && (
            <div className="animate-slide-in rounded-[var(--radius-lg)] border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="animate-slide-in rounded-[var(--radius-lg)] border border-secondary bg-secondary/10 p-4 text-sm text-secondary">
              {success}
            </div>
          )}

          {!apiKey && (
            <div className="rounded-[var(--radius-lg)] border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
              Configura tu API key de metalpriceapi.com para ver los precios del
              oro en tiempo real.
            </div>
          )}

          <Dashboard assets={assets} metalPrice={metalPrice} refreshing={loading} />

          <AssetTable
            assets={assets}
            metalPrice={metalPrice}
            onDelete={handleDeleteAsset}
            onEdit={handleEditAsset}
            newAssetId={newAssetId}
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
