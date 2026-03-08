import React from 'react'

const fetch = 'fetch' as const,
  success = 'success' as const,
  error = 'error' as const

interface FetchState {
  data: any
  loading: boolean
  error: boolean
}

type FetchAction =
  | { type: typeof fetch }
  | { type: typeof success; data: any }
  | { type: typeof error }

const fetchReducer = (state: FetchState, action: FetchAction): FetchState => {
  switch (action.type) {
    case fetch:
      return {
        ...state,
        loading: true,
      }
    case success:
      return {
        data: action.data,
        error: false,
        loading: false,
      }
    case error:
      return {
        ...state,
        error: true,
        loading: false,
      }
    default:
      throw new Error('Action type unsupported')
  }
}

// using global cache b/c
//   - useRef does not work when component is 'hidden'
//   - using global state is too complex
const cache: Record<string, any> = {}

export const useFetch = (url: string): FetchState => {
  const [state, dispatch] = React.useReducer(fetchReducer, {
    data: null,
    loading: true,
    error: false,
  })
  React.useEffect(() => {
    dispatch({ type: fetch })
    let isCancelled = false
    if (cache[url]) {
      // using setTimeout b/c UpvoteRemovalRateHistory graph does not
      // properly re-render axes unless there is a delay. Why?
      setTimeout(() => {
        if (!isCancelled) {
          dispatch({ type: success, data: cache[url] })
        }
      }, 30)
    } else {
      window
        .fetch(url)
        .then(response => response.json())
        .then(data => {
          cache[url] = data
          if (!isCancelled) {
            dispatch({ type: success, data })
          }
        })
        .catch(e => {
          console.warn(e.message)
          if (!isCancelled) {
            dispatch({ type: error })
          }
        })
    }
    return () => {
      isCancelled = true
    }
  }, [url])
  return { ...state }
}

interface FetchProps {
  url: string
  render?: (result: FetchState) => React.ReactNode
}

export const Fetch = ({ url, render }: FetchProps): React.ReactNode => {
  const result = useFetch(url)
  return render && result ? render(result) : null
}
