import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "./ErrorBoundary"

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    )
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("renders error UI when child throws", () => {
    function Bomb(): React.ReactNode {
      throw new Error("Test error")
    }
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    consoleSpy.mockRestore()
    expect(screen.getByText("Algo salió mal")).toBeInTheDocument()
  })

  it('shows error details when "Detalles técnicos" is clicked', async () => {
    function Bomb(): React.ReactNode {
      throw new Error("Test error")
    }
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    consoleSpy.mockRestore()
    const details = screen.getByText("Detalles técnicos")
    details.click()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it('renders "Recargar" button when error occurs', () => {
    function Bomb(): React.ReactNode {
      throw new Error("Test error")
    }
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    consoleSpy.mockRestore()
    expect(screen.getByText("Recargar")).toBeInTheDocument()
  })

  it('renders "Vaciar datos" button when error occurs', () => {
    function Bomb(): React.ReactNode {
      throw new Error("Test error")
    }
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    consoleSpy.mockRestore()
    expect(screen.getByText("Vaciar datos")).toBeInTheDocument()
  })
})