import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SettingsDialog } from "./SettingsDialog"

describe("SettingsDialog", () => {
  it("renders API key input when open", () => {
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} />)
    expect(screen.getByText("Configuración")).toBeInTheDocument()
    expect(screen.getByLabelText("API Key")).toBeInTheDocument()
  })

  it("submit button is disabled when input is empty", () => {
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  it("calls onSave with trimmed key", async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={onSave} />)
    await user.type(screen.getByLabelText("API Key"), "  my-api-key  ")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    expect(onSave).toHaveBeenCalledWith("my-api-key")
  })

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<SettingsDialog open={true} onOpenChange={onOpenChange} existingKey={null} onSave={vi.fn()} />)
    await user.click(screen.getByText("Cancelar"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("pre-fills existing key", () => {
    render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey="my-key" onSave={vi.fn()} />)
    expect(screen.getByDisplayValue("my-key")).toBeInTheDocument()
  })

  describe("data section", () => {
    it("renders export/import section when onExport and onImport are provided", () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} onExport={vi.fn()} onImport={vi.fn()} />)
      expect(screen.getByText("Exportar datos")).toBeInTheDocument()
      expect(screen.getByText("Importar datos")).toBeInTheDocument()
      expect(screen.getByText("Importar reemplazará todos los datos actuales.")).toBeInTheDocument()
    })

    it("does not render export/import section when onExport and onImport are omitted", () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} />)
      expect(screen.queryByText("Exportar datos")).not.toBeInTheDocument()
    })

    it("calls onExport when Exportar datos button is clicked", async () => {
      const onExport = vi.fn()
      const onImport = vi.fn()
      const user = userEvent.setup()
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} onExport={onExport} onImport={onImport} />)
      await user.click(screen.getByText("Exportar datos"))
      expect(onExport).toHaveBeenCalledTimes(1)
    })

    it("file input exists and is hidden", () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} onExport={vi.fn()} onImport={vi.fn()} />)
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput?.className).toContain("hidden")
      expect(fileInput?.accept).toContain(".json")
    })
  })

  describe("auto-refresh section", () => {
    it("renders auto-refresh select when onSaveAutoRefresh is provided", () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} onSaveAutoRefresh={vi.fn()} autoRefreshInterval={0} />)
      expect(screen.getByText("Actualización automática")).toBeInTheDocument()
      expect(screen.getByRole("combobox")).toBeInTheDocument()
      expect(screen.getByText("Desactivado")).toBeInTheDocument()
    })

    it("does not render when onSaveAutoRefresh is omitted", () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} />)
      expect(screen.queryByText("Actualización automática")).not.toBeInTheDocument()
    })

    it("pre-selects the current interval value", () => {
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} onSaveAutoRefresh={vi.fn()} autoRefreshInterval={15} />)
      const select = screen.getByRole("combobox") as HTMLSelectElement
      expect(select.value).toBe("15")
    })

    it("calls onSaveAutoRefresh when selection changes", async () => {
      const onSaveAutoRefresh = vi.fn()
      const user = userEvent.setup()
      render(<SettingsDialog open={true} onOpenChange={vi.fn()} existingKey={null} onSave={vi.fn()} onSaveAutoRefresh={onSaveAutoRefresh} autoRefreshInterval={0} />)
      const select = screen.getByRole("combobox") as HTMLSelectElement
      await user.selectOptions(select, "30")
      expect(onSaveAutoRefresh).toHaveBeenCalledWith(30)
    })
  })
})