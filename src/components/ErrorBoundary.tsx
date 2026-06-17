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
          <div className="max-w-md space-y-6 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="mx-auto opacity-40"
            >
              <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" className="text-gold-border"/>
              <circle cx="16" cy="18" r="1.5" fill="currentColor" className="text-muted-foreground"/>
              <circle cx="32" cy="18" r="1.5" fill="currentColor" className="text-muted-foreground"/>
              <path d="M16 30 Q24 36 32 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" className="text-muted-foreground"/>
            </svg>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                Algo salió mal
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ha ocurrido un error inesperado. No te preocupes — tus activos
                están a salvo en tu navegador. Prueba a recargar la página.
              </p>
            </div>
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
