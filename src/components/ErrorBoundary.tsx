import { Component, type ReactNode } from "react"
import { clearAppData } from "../lib/storage"
import { Button } from "./ui/Button"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Algo salió mal
            </h1>
            <p className="text-muted-foreground">
              Ha ocurrido un error inesperado. Recarga la página o vacía los
              datos de la aplicación si el problema persiste.
            </p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => window.location.reload()}
              >
                Recargar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearAppData()
                  window.location.reload()
                }}
              >
                Vaciar datos
              </Button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 overflow-auto rounded border bg-muted p-2 text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
