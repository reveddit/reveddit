import { create } from 'zustand'
import type { GlobalStore } from 'state'

// Re-export the store hook from state.ts for convenience.
// This lets components do `import { useGlobal } from 'hooks/useGlobal'`
// instead of the legacy `connect()` HOC.
//
// NOTE: The canonical store is defined in state.ts.
// This module re-exports a selector helper so new components can
// consume the store idiomatically with hooks.
//
// Usage:
//   const { state, setState } = useGlobal()
//   const loading = useGlobal(s => s.state.loading)

// We can't import the store directly from state.ts at module level because
// of potential circular dependency issues. Instead, we provide a small
// shim that lazily resolves the store.

type StoreHook = {
  (): GlobalStore
  <T>(selector: (state: GlobalStore) => T): T
}

let _store: StoreHook | null = null

export const _setStore = (store: StoreHook) => {
  _store = store
}

/**
 * Hook-style access to the global Zustand store.
 *
 * If a selector function is provided it will be forwarded to
 * zustand's useStore, narrowing re-renders.
 */
function useGlobal(): GlobalStore
function useGlobal<T>(selector: (state: GlobalStore) => T): T
function useGlobal<T>(selector?: (state: GlobalStore) => T): GlobalStore | T {
  if (!_store) {
    // Lazy import — runs once.
    // eslint-disable-next-line
    const { default: store } = require('state')
    _store = store
  }
  return selector ? _store!(selector) : _store!()
}

export default useGlobal
