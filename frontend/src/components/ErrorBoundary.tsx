import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-gray-900 rounded-3xl border border-gray-800 p-8 text-center shadow-2xl">
            <h1 className="text-2xl font-bold mb-4">Algo salio mal</h1>
            <p className="text-gray-400 mb-6">
              Ocurrio un error inesperado. Por favor recarga la pagina o vuelve al inicio.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full px-6 py-2 bg-emerald-500 text-black font-bold hover:opacity-90 transition"
            >
              Recargar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
