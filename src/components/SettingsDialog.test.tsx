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
})