import React, { useRef, useCallback, useState } from 'react'
import { getUserStatus } from 'api/reveddit'

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

interface ShadowbanCheckButtonProps {
  user: string
  global: any
}

const ShadowbanCheckButton: React.FC<ShadowbanCheckButtonProps> = ({
  user,
  global,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToken = useCallback(
    async (token: string) => {
      setError(null)
      try {
        const data = await getUserStatus(user, token)
        if (data.error || !data.user_status) {
          console.error(data.error)
          global.setError({ userIssueDescription: 'deleted_shadowbanned' })
        } else {
          global.setError({ userIssueDescription: data.user_status })
        }
      } catch (e) {
        console.error(e)
        setError('Check failed. Please try again.')
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      } finally {
        setChecking(false)
      }
    },
    [user, global]
  )

  const handleClick = useCallback(() => {
    if (!window.turnstile) {
      setError('Turnstile not loaded. Please refresh and try again.')
      return
    }
    setChecking(true)
    if (widgetIdRef.current) {
      window.turnstile.execute(widgetIdRef.current)
    } else if (containerRef.current) {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITEKEY,
        callback: handleToken,
        'error-callback': () => {
          setError('Verification failed. Please try again.')
          setChecking(false)
        },
      })
    }
  }, [handleToken])

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <button onClick={handleClick} disabled={checking}>
          {checking ? 'Checking…' : 'Check if shadowbanned'}
        </button>
      </div>
      <div ref={containerRef} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default ShadowbanCheckButton
