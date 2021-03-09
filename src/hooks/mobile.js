import React, {useState, useEffect} from 'react'

const r = 'resize'
export const useIsMobile = () => {
  const [width, setWidth] = useState(window.innerWidth)
  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth)
  }
  useEffect(() => {
    window.addEventListener(r, handleWindowSizeChange);
    return () => {
      window.removeEventListener(r, handleWindowSizeChange);
    }
  }, [])
  return width <= 768
}
