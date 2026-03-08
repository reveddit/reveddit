import { create } from 'zustand'

// Re-export the store hook from state.js for convenience.
// This lets components do `import { useGlobal } from 'hooks/useGlobal'`
// instead of the legacy `connect()` HOC.
//
// NOTE: The canonical store is defined in state.js.
// This module re-exports a selector helper so new components can
// consume the store idiomatically with hooks.
//
// Usage:
//   const { state, setState } = useGlobal()
//   const loading = useGlobal(s => s.state.loading)

// We can't import the store directly from state.js at module level because
// of potential circular dependency issues. Instead, we provide a small
// shim that lazily resolves the store.

let _store = null

export const _setStore = store => {
  _store = store
}

/**
 * Hook-style access to the global Zustand store.
 *
 * If a selector function is provided it will be forwarded to
 * zustand's useStore, narrowing re-renders.
 *
 * @template T
 * @param {((state: any) => T)=} selector
 * @returns {T}
 */
const useGlobal = selector => {
  if (!_store) {
    // Lazy import — runs once.
    // eslint-disable-next-line
    const { default: store } = require('state')
    _store = store
  }
  return selector ? _store(selector) : _store()
}

export default useGlobal
