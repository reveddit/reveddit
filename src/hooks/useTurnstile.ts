import { useRef, useCallback } from 'react'

declare const TURNSTILE_SITEKEY: string

interface TurnstileInstance {
  render: (container: HTMLElement, options: Record<string, any>) => string
  execute: (widgetId: string) => void
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance
  }
}

export const useTurnstile = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  const getToken = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.turnstile) {
        reject(new Error('Turnstile not loaded'))
        return
      }
      if (!containerRef.current) {
        const div = document.createElement('div')
        div.style.display = 'none'
        document.body.appendChild(div)
        containerRef.current = div
      }
      if (widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current)
        window.turnstile.execute(widgetIdRef.current)
      } else {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          size: 'invisible',
          callback: resolve,
          'error-callback': () => reject(new Error('Turnstile verification failed')),
        })
      }
    })
  }, [])

  return { getToken }
}
