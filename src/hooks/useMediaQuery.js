import { useState, useEffect } from 'react'

/**
 * Returns `true` when the viewport matches the given CSS media query.
 *
 * @param {string} query  e.g. `'(max-width: 768px)'`
 * @returns {boolean}
 */
const useMediaQuery = query => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = e => setMatches(e.matches)
    // Modern API; falls back for older browsers.
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else {
      mql.addListener(handler)
    }
    // Sync in case the value changed between render and effect.
    setMatches(mql.matches)
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler)
      } else {
        mql.removeListener(handler)
      }
    }
  }, [query])

  return matches
}

export default useMediaQuery
