import React from 'react'

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>error.</div>
    }

    // @ts-expect-error React 19 types removed this.props from class components
    return this.props.children
  }
}

export default ErrorBoundary
