import { useEffect, useState } from 'react'
import { browserStore } from 'components/ui/Extensions'
import {
  getExtensionPreview,
  getMarkedExtensionStore,
  useExtensionStatus,
  useRunningExtensionVersion,
} from 'api/reddit/extensionStatus'

// Whether the running extension is behind the version its store serves. The
// stores review releases at different speeds, so each is compared with its own
// entry in the feed's store_versions, the same feed the extension reads
// (dist/extension-news.json, kept current by scripts/sync-store-version.py).

export type ExtensionStore = 'chrome' | 'edge' | 'firefox'
type StoreVersions = Partial<Record<ExtensionStore, string>>

export interface ExtensionUpdate {
  store: ExtensionStore
  installed: string
  available: string
}

const STORES: ExtensionStore[] = ['chrome', 'edge', 'firefox']
const BROWSER_STORES: Record<string, ExtensionStore> = {
  c: 'chrome',
  e: 'edge',
  f: 'firefox',
}
const VERSION_RE = /^\d+(\.\d+){0,3}$/
// ?extension_test=behind shows this when the feed has nothing newer than the
// preview's version
const PREVIEW_AVAILABLE = '0.0.5.24'

// Numeric dotted-version compare: negative when a < b, zero when equal
export const compareVersions = (a: string, b: string): number => {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0)
  const pb = b.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) {
      return d
    }
  }
  return 0
}

// The store whose build is running. Versions after 0.0.5.24 mark it; for
// older ones, go by the browser, though Edge can also install the Chrome
// store's build.
export const getExtensionStore = (): ExtensionStore | null => {
  const marked = getMarkedExtensionStore() as ExtensionStore
  if (STORES.includes(marked)) {
    return marked
  }
  return (browserStore && BROWSER_STORES[browserStore]) || null
}

// The update this install is missing, or null when it is current or its
// store's version is unknown
export const findExtensionUpdate = (
  store: ExtensionStore | null,
  installed: string,
  versions: StoreVersions
): ExtensionUpdate | null => {
  const available = store ? versions[store] : undefined
  if (
    !store ||
    !available ||
    !VERSION_RE.test(available) ||
    !VERSION_RE.test(installed) ||
    compareVersions(installed, available) >= 0
  ) {
    return null
  }
  return { store, installed, available }
}

let storeVersions: Promise<StoreVersions> | null = null

// Once per page load; the feed's own cache headers (10 minutes) cover the rest
const loadStoreVersions = (): Promise<StoreVersions> => {
  if (!storeVersions) {
    storeVersions = fetch('/extension-news.json')
      .then(res => (res.ok ? res.json() : null))
      .then(feed => feed?.store_versions || {})
      .catch(() => ({}))
  }
  return storeVersions
}

// The newer version the running extension's store has: null when there is
// none to tell about, undefined until that is known
export const useExtensionUpdate = (): ExtensionUpdate | null | undefined => {
  const shown = useExtensionStatus()
  const installed = useRunningExtensionVersion()
  const [versions, setVersions] = useState<StoreVersions | null>(null)
  useEffect(() => {
    let current = true
    // Fetched while a running extension's check is still settling, so the
    // answer is ready when it does
    if (shown === 'running') {
      loadStoreVersions().then(v => {
        if (current) {
          setVersions(v)
        }
      })
    }
    return () => {
      current = false
    }
  }, [shown])
  if (shown !== 'running') {
    return null
  }
  if (!installed || !versions) {
    return undefined
  }
  const store = getExtensionStore()
  const preview = getExtensionPreview()
  if (preview) {
    // Only =behind previews this; the other previews keep their own banners
    return preview === 'behind'
      ? findExtensionUpdate(store, installed, versions) || {
          store: store || 'chrome',
          installed,
          available: PREVIEW_AVAILABLE,
        }
      : null
  }
  return findExtensionUpdate(store, installed, versions)
}
