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

// Turnstile can stall silently (widget never renders, challenge never
// resolves): thread and history pages used to hang blank behind it. Give up
// after this long; callers treat a rejection as "no token" and proceed.
const TURNSTILE_TIMEOUT_MS = 9000

export const useTurnstile = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const callbackRef = useRef<((token: string) => void) | null>(null)
  const errorRef = useRef<(() => void) | null>(null)

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
      let settled = false
      const settle = (fn: () => void) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        callbackRef.current = null
        errorRef.current = null
        fn()
      }
      const timer = window.setTimeout(
        () => settle(() => reject(new Error('Turnstile timed out'))),
        TURNSTILE_TIMEOUT_MS
      )
      callbackRef.current = token => settle(() => resolve(token))
      errorRef.current = () =>
        settle(() => reject(new Error('Turnstile verification failed')))
      if (widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current)
        window.turnstile.execute(widgetIdRef.current)
      } else {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          size: 'flexible',
          callback: (token: string) => callbackRef.current?.(token),
          'error-callback': () => errorRef.current?.(),
        })
      }
    })
  }, [])

  return { getToken }
}
