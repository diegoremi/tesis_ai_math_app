import { Component, type ReactNode } from 'react';
import { TM, FONT_MONO } from './terminal';

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
        <div style={{
          minHeight: '100vh', background: TM.bgDeep,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px', fontFamily: FONT_MONO,
        }}>
          <div style={{
            maxWidth: 420, width: '100%',
            background: TM.panel, border: `1px solid ${TM.rule}`,
            borderLeft: `2px solid ${TM.red}`,
            padding: 28,
          }}>
            <div style={{ fontSize: 12, color: TM.dim, marginBottom: 14 }}>$ ./app --crash</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: TM.fg, marginBottom: 8 }}>
              <span style={{ color: TM.red }}>err →</span> algo salió mal
            </h1>
            <p style={{ fontSize: 13, color: TM.dim, marginBottom: 22, lineHeight: 1.6 }}>
              // ocurrió un error inesperado. recargá la página o volvé al inicio.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: TM.amber, color: TM.bgDeep,
                border: `1px solid ${TM.amber}`,
                padding: '7px 16px', fontSize: 13,
                fontFamily: FONT_MONO, cursor: 'pointer',
                fontWeight: 700, borderRadius: 0,
              }}
            >
              ./recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
