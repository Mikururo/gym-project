import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="mb-1 text-lg font-semibold">Что-то пошло не так</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {this.state.error?.message || 'Произошла неизвестная ошибка'}
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Попробовать снова
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
