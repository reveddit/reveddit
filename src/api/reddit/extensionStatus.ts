import { useSyncExternalStore } from 'react'

// Whether Reveddit Real-Time is running in this browser right now, not just
// whether it ever ran here. Its content script stamps localStorage on every
// reveddit page load (after the page's own scripts start), but a disabled or
// removed extension leaves the old stamp behind, so a stamp alone proves
// nothing.
//
// Live evidence, fastest first:
// - Every browser, versions after 0.0.5.23: the extension marks the page
//   before any of its scripts run (<html data-reveddit-extension="version">,
//   from real-time-extension src/src/content-revddit-start.ts). The mark
//   lives in this page, so unlike the stamp it can't be left over from an
//   earlier visit.
// - Chromium browsers: the extension answers {action: 'version'} through
//   externally_connectable within milliseconds. That also puts chrome.runtime
//   on reveddit pages, so outside Edge (whose store build has another ID) no
//   answer means it isn't running.
// - Every browser: the content script writes the stamp again during this
//   load. The check takes the stamp away at startup and waits for it to come
//   back.
//
// The last confirmed sighting is kept, so a visitor whose extension stopped
// running is asked to turn it back on rather than shown an install pitch. When
// that sighting was a mark, a page without one means it isn't running.

declare const EXTENSION_ID: string

export type ExtensionStatus = 'checking' | 'running' | 'not-running' | 'absent'
export type ShownExtensionStatus = Exclude<ExtensionStatus, 'checking'>

const STAMP_VERSION = 'notifierExtensionVersion'
const STAMP_PRESENT = 'hasNotifierExtension'
const LAST_SEEN = 'revedditExtensionLastSeen'
// Left over from the first fix for stale stamps, which this check replaces
const OLD_MISSED_LOADS = 'notifierExtensionMissedLoads'
// After this long without a sighting, an extension that stopped running counts
// as never installed again
const LAST_SEEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
// The content script runs at document_idle, around the window load event
const STAMP_WAIT_AFTER_LOAD_MS = 3000
const POLL_MS = 100

// ?extension_test=on|off|none previews each state without changing anything
const TEST_STATES: Record<string, ShownExtensionStatus> = {
  on: 'running',
  off: 'not-running',
  none: 'absent',
}

let status: ExtensionStatus = 'absent'
// Shown while checking, so a running extension doesn't flash an install pitch
let expected: ShownExtensionStatus = 'absent'
let version: string | null = null
// Whether the extension marked this page
let marked = false
let started = false
const listeners = new Set<() => void>()
let settledWaiters: Array<(s: ExtensionStatus) => void> = []
// The bridge relay (bridge.ts) goes through the content script, which
// starts listening at document_idle, right after it writes the stamp. A mark
// shows the extension running well before that. Null until known.
let relayReady: boolean | null = null
let relayWaiters: Array<(ready: boolean) => void> = []

const storage = (): Storage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const readMark = (): string | null =>
  document.documentElement.dataset.revedditExtension ?? null

const readStamp = (): string | null => {
  const s = storage()
  if (!s) {
    return null
  }
  // Versions before the version stamp only wrote the presence flag
  return s.getItem(STAMP_VERSION) || (s.getItem(STAMP_PRESENT) ? '' : null)
}

const readLastSeen = (): {
  version: string
  at: number
  marked?: boolean
} | null => {
  try {
    const seen = JSON.parse(storage()?.getItem(LAST_SEEN) || 'null')
    if (seen && Date.now() - seen.at < LAST_SEEN_MAX_AGE_MS) {
      return seen
    }
  } catch {
    // unreadable: treat as never seen
  }
  return null
}

const writeLastSeen = () => {
  try {
    storage()?.setItem(
      LAST_SEEN,
      JSON.stringify({ version: version || '', at: Date.now(), marked })
    )
  } catch {
    // storage full or blocked
  }
}

const settle = (next: ShownExtensionStatus, seenVersion?: string | null) => {
  // A later sighting can still overturn "not running"; nothing else changes a
  // settled status
  if (
    status !== 'checking' &&
    !(status === 'not-running' && next === 'running')
  ) {
    return
  }
  status = next
  if (seenVersion) {
    version = seenVersion
  }
  if (next === 'running') {
    writeLastSeen()
  }
  listeners.forEach(listener => listener())
  const waiters = settledWaiters
  settledWaiters = []
  waiters.forEach(resolve => resolve(status))
}

const settleRelay = (ready: boolean) => {
  if (relayReady !== null) {
    return
  }
  relayReady = ready
  const waiters = relayWaiters
  relayWaiters = []
  waiters.forEach(resolve => resolve(ready))
}

const isChromiumOutsideEdge = (): boolean => {
  const ua = navigator.userAgent
  return (
    Boolean((window as any).chrome) && /Chrome\//.test(ua) && !/Edg\//.test(ua)
  )
}

const askChromium = () => {
  let runtime: any = null
  try {
    runtime = (window as any).chrome?.runtime
  } catch {
    runtime = null
  }
  const definitive = isChromiumOutsideEdge()
  if (!runtime?.sendMessage) {
    if (definitive) {
      settle(expected === 'absent' ? 'absent' : 'not-running')
    }
    return
  }
  try {
    runtime.sendMessage(EXTENSION_ID, { action: 'version' }, (resp: any) => {
      // lastError must be read to avoid an unchecked-error console warning
      const err = runtime.lastError
      if (!err && resp?.version) {
        settle('running', String(resp.version))
      } else if (definitive) {
        settle(expected === 'absent' ? 'absent' : 'not-running')
      }
    })
  } catch {
    // chrome.runtime can throw in odd embedder contexts; the stamp still decides
  }
}

const watchStamp = () => {
  let loadedAt = document.readyState === 'complete' ? Date.now() : 0
  if (!loadedAt) {
    window.addEventListener('load', () => (loadedAt = Date.now()), {
      once: true,
    })
  }
  const timer = window.setInterval(() => {
    const stamp = readStamp()
    if (stamp !== null) {
      window.clearInterval(timer)
      settle('running', stamp || version)
      settleRelay(true)
      return
    }
    if (loadedAt && Date.now() - loadedAt > STAMP_WAIT_AFTER_LOAD_MS) {
      window.clearInterval(timer)
      // A "running" from the mark or Chromium stands: the content script may
      // not run in this tab (opened before the extension was turned on)
      settle(expected === 'absent' ? 'absent' : 'not-running')
      settleRelay(false)
    }
  }, POLL_MS)
}

// Call once, before the first render
export const startExtensionCheck = () => {
  if (started) {
    return
  }
  started = true
  const test = new URLSearchParams(window.location.search).get('extension_test')
  if (test && TEST_STATES[test]) {
    status = TEST_STATES[test]
    version = status === 'absent' ? null : '0.0.5.23'
    // Previews don't watch the relay; bridge requests go straight out
    settleRelay(true)
    return
  }
  const mark = readMark()
  marked = mark !== null
  const s = storage()
  if (!s) {
    // The content script can't run without storage either, so only the mark
    // can tell
    status = marked ? 'running' : 'absent'
    version = mark || null
    settleRelay(false)
    return
  }
  s.removeItem(OLD_MISSED_LOADS)
  const stamp = readStamp()
  let lastSeen = readLastSeen()
  if (stamp !== null && !lastSeen) {
    // A stamp from before this check existed: it ran here at some point
    version = stamp
    writeLastSeen()
    lastSeen = readLastSeen()
  }
  version = stamp || lastSeen?.version || null
  expected = stamp !== null ? 'running' : lastSeen ? 'not-running' : 'absent'
  status = 'checking'
  // A running content script writes these again during this load
  s.removeItem(STAMP_VERSION)
  s.removeItem(STAMP_PRESENT)
  if (mark !== null) {
    settle('running', mark)
  } else {
    if (lastSeen?.marked) {
      // The version seen here last marks every page it runs on. Chromium or
      // the stamp can still overturn this.
      settle('not-running')
    }
    askChromium()
  }
  watchStamp()
}

export const getExtensionStatus = (): ExtensionStatus => status

export const getShownExtensionStatus = (): ShownExtensionStatus =>
  status === 'checking' ? expected : status

// The running version, or the last one seen when it isn't running
export const getKnownExtensionVersion = (): string | null => version

export const extensionStatusSettled = (): Promise<ExtensionStatus> =>
  status === 'checking'
    ? new Promise(resolve => settledWaiters.push(resolve))
    : Promise.resolve(status)

// Whether the content script relays bridge requests on this page: true once it
// starts, false if it hasn't by the time the check gives up
export const extensionRelayReady = (): Promise<boolean> =>
  relayReady === null
    ? new Promise(resolve => relayWaiters.push(resolve))
    : Promise.resolve(relayReady)

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useExtensionStatus = (): ShownExtensionStatus =>
  useSyncExternalStore(subscribe, getShownExtensionStatus)
