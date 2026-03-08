import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'reveddit-theme'

const getTheme = () => localStorage.getItem(STORAGE_KEY) || 'dark'

/**
 * Hook for reading / toggling the site's dark / light theme.
 *
 * Keeps `document.documentElement[data-theme]` and `localStorage`
 * in sync with the returned value.
 *
 * @returns {{ theme: 'dark'|'light', toggleTheme: () => void }}
 */
const useTheme = () => {
  const [theme, setTheme] = useState(getTheme)

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
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
