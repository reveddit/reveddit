import { createContext, useContext } from 'react'

interface ThreadContextValue {
  focusCommentID: string
  contextAncestors: Record<string, boolean>
  setShowSingleRoot: (value: boolean) => void
  visibleComments: Record<string, any[]>
}

const ThreadContext = createContext<ThreadContextValue | null>(null)

export const useThreadContext = () => {
  const ctx = useContext(ThreadContext)
  if (!ctx) {
    throw new Error('useThreadContext must be used within a ThreadProvider')
  }
  return ctx
}

export const ThreadProvider = ThreadContext.Provider
export default ThreadContext
