// Client for the extension's reddit-data bridge (real-time-extension
// src/src/bridge.ts). The extension's background fetches run under
// host_permissions, so they bypass both page CORS and reddit's blocks on
// website-origin requests. Used for the endpoints JSONP cannot serve and as
// the fallback if reddit removes JSONP. The extension protects the user's own
// monitoring: it refuses with rate_limited/busy/budget_exhausted rather than
// queueing, and this client then falls back to JSONP (jsonp.ts), which spends
// the page's own budget instead.
//
// Two transports, one message shape:
// - Chrome/Edge: chrome.runtime.sendMessage(EXTENSION_ID, ...) via
//   externally_connectable
// - Firefox (no externally_connectable): window.postMessage relayed by the
//   content script

declare const EXTENSION_ID: string

const BRIDGE_MIN_VERSION = [0, 0, 5, 21]
const BRIDGE_TIMEOUT_MS = 10000

// The content script stamps its version in localStorage on every load (also
// pre-bridge versions, which would otherwise swallow relay messages).
const extensionVersionAtLeast = (min: number[]): boolean => {
  try {
    const v = window.localStorage.getItem('notifierExtensionVersion')
    if (!v) {
      return false
    }
    const parts = v.split('.').map(Number)
    for (let i = 0; i < min.length; i++) {
      const p = parts[i] || 0
      if (p > min[i]) {
        return true
      }
      if (p < min[i]) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}

// 'no' only means absent (no listener/timeout), never a refusal — refusals
// prove the bridge exists
let bridgeState: 'unknown' | 'yes' | 'no' = 'unknown'

const chromeRuntime = (): any => {
  try {
    const runtime = (window as any).chrome?.runtime
    return runtime?.sendMessage ? runtime : null
  } catch {
    return null
  }
}

const sendViaChrome = (url: string): Promise<any> =>
  new Promise((resolve, reject) => {
    const runtime = chromeRuntime()
    if (!runtime) {
      return reject(new Error('bridge unavailable'))
    }
    const timer = setTimeout(
      () => reject(new Error('bridge unavailable')),
      BRIDGE_TIMEOUT_MS
    )
    try {
      runtime.sendMessage(
        EXTENSION_ID,
        { action: 'bridge-fetch', url },
        (resp: any) => {
          clearTimeout(timer)
          // lastError must be read to avoid an unchecked-error console warning
          const err = (window as any).chrome?.runtime?.lastError
          if (err || !resp) {
            return reject(new Error('bridge unavailable'))
          }
          resolve(resp)
        }
      )
    } catch {
      clearTimeout(timer)
      reject(new Error('bridge unavailable'))
    }
  })

let relayListening = false
let nextRelayID = 1
const relayPending = new Map<
  number,
  { resolve: (r: any) => void; timer: any }
>()

const sendViaRelay = (url: string): Promise<any> =>
  new Promise((resolve, reject) => {
    if (!relayListening) {
      relayListening = true
      window.addEventListener('message', e => {
        const d: any = e.data
        if (
          e.source !== window ||
          !d ||
          d.type !== 'reveddit-bridge-response' ||
          typeof d.id !== 'number'
        ) {
          return
        }
        const entry = relayPending.get(d.id)
        if (entry) {
          relayPending.delete(d.id)
          clearTimeout(entry.timer)
          entry.resolve(d)
        }
      })
    }
    const id = nextRelayID++
    const timer = setTimeout(() => {
      relayPending.delete(id)
      reject(new Error('bridge unavailable'))
    }, BRIDGE_TIMEOUT_MS)
    relayPending.set(id, { resolve, timer })
    window.postMessage(
      { type: 'reveddit-bridge-request', id, url },
      window.location.origin
    )
  })

// Response-like result so existing .then(response => response.json()) chains
// work unchanged; rejects on refusal or absence so callers can fall back
export const bridgeFetch = async (url: string): Promise<any> => {
  if (bridgeState === 'no' || !extensionVersionAtLeast(BRIDGE_MIN_VERSION)) {
    throw new Error('bridge unavailable')
  }
  let resp
  try {
    resp = await (chromeRuntime() ? sendViaChrome(url) : sendViaRelay(url))
  } catch (e) {
    bridgeState = 'no'
    throw e
  }
  bridgeState = 'yes'
  if (!resp.ok) {
    // rate_limited | busy | budget_exhausted | invalid url | http failure —
    // the extension exists but declined; the caller falls back to JSONP
    throw new Error(`bridge refused: ${resp.error || resp.status}`)
  }
  return {
    ok: true,
    status: resp.status,
    json: async () => resp.data,
    headers: { get: (_name: string) => null },
  }
}
