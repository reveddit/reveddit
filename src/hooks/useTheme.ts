import { useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'
const STORAGE_KEY = 'reveddit-theme'

const getTheme = (): Theme =>
  (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark'

/**
 * Hook for reading / toggling the site's dark / light theme.
 *
 * Keeps `document.documentElement[data-theme]` and `localStorage`
 * in sync with the returned value.
 */
const useTheme = (): { theme: Theme; toggleTheme: () => void } => {
  const [theme, setTheme] = useState<Theme>(getTheme)

  const toggleTheme = useCallback(() => {
    setTheme((prev: Theme) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  // Sync on mount in case another tab changed the value.
  useEffect(() => {
    const current = getTheme()
    document.documentElement.setAttribute('data-theme', current)
    setTheme(current)
  }, [])

  return { theme, toggleTheme }
}

export default useTheme
