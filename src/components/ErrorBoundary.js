import React from 'react'

class ErrorBoundary extends React.Component {

  state = { hasError: false }

  static getDerivedStateFromError(error) {
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

    return this.props.children
  }
}

export default ErrorBoundary
