import React from 'react'

class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '1.5rem',
            margin: '1rem 0',
            border: '1px solid var(--color-border, #ccc)',
            borderRadius: '6px',
            backgroundColor: 'var(--color-bg-secondary, #f9f9f9)',
            color: 'var(--color-text, #333)',
          }}
        >
          <h3
            style={{ margin: '0 0 0.5rem', color: 'var(--color-error, #c00)' }}
          >
            Something went wrong
          </h3>
          <p style={{ margin: '0 0 0.75rem' }}>
            An error occurred while rendering this section. You can try
            reloading the page.
          </p>
          {this.state.error && (
            <details style={{ fontSize: '0.85em', opacity: 0.8 }}>
              <summary style={{ cursor: 'pointer' }}>Error details</summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  overflow: 'auto',
                  backgroundColor: 'var(--color-bg-tertiary, #eee)',
                  borderRadius: '4px',
                  fontSize: '0.85em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.75rem',
              padding: '0.4rem 1rem',
              cursor: 'pointer',
              border: '1px solid var(--color-border, #ccc)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg, #fff)',
              color: 'var(--color-text, #333)',
            }}
          >
            Reload page
          </button>
        </div>
      )
    }

    // @ts-expect-error React 19 types removed this.props from class components
    return this.props.children
  }
}

export default ErrorBoundary
