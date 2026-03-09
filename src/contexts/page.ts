import { createContext, useContext } from 'react'

const PageContext = createContext<string | undefined>(undefined)

export const usePageType = (): string => {
  const ctx = useContext(PageContext)
  if (ctx === undefined) {
    return ''
  }
  return ctx
}

export const PageTypeProvider = PageContext.Provider

export default PageContext
