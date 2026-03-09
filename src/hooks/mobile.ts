import { useState, useEffect } from 'react'

const r = 'resize'
export const useIsMobile = (): boolean => {
  const [width, setWidth] = useState<number>(window.innerWidth)
  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth)
  }
  useEffect(() => {
    window.addEventListener(r, handleWindowSizeChange)
    return () => {
      window.removeEventListener(r, handleWindowSizeChange)
    }
  }, [])
  return width <= 768
}
