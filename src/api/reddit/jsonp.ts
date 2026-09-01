import { getCustomClientID } from 'utils'
import { bridgeFetch } from './bridge'
import { recordTransport } from './status'

// In 2026 Reddit deleted Reveddit's registered API apps (token requests 401
// for every client_id), and no reddit host serves CORS headers on content
// responses to page origins, so window.fetch cannot read any reddit endpoint
// from the site. Reddit's legacy JSONP support (?jsonp=callback) still works
// unauthenticated on www.reddit.com Listing/Thing endpoints, including
// api/info batched at 100 ids with removed_by_category populated. This module
// provides that transport.
//
// The JSONP script is reddit-controlled code, so it executes inside a
// sandboxed srcdoc iframe (allow-scripts only => opaque origin): it cannot
// touch reveddit's DOM, cookies, or storage. A srcdoc iframe inherits the
// parent CSP, so netlify.toml's script-src must include https://www.reddit.com
// (production only; the vite dev server sends no CSP).
//
// Not JSONP-able (script error): user/<u>/moderated_subreddits,
// api/user_data_by_account_ids, api/username_available, r/<sub>/about/log
// (publicmodlogs), api/morechildren, quarantined content. Callers degrade.

const www_reddit_slash = 'https://www.reddit.com/'
const oauth_reddit = 'https://oauth.reddit.com/'

const JSONP_TIMEOUT_MS = 20000

// srcdoc shim: receives {type:'jsonp-request', id, url}, injects the script
// tag, posts back {type:'jsonp-response', id, ok, data|error}. Runs in an
// opaque origin; parent identifies it by e.source, not e.origin (which is
// 'null' for sandboxed frames).
const SHIM_HTML =
  `<script>
'use strict'
window.addEventListener('message', function (e) {
  var d = e.data || {}
  if (d.type !== 'jsonp-request' || typeof d.url !== 'string' || typeof d.id !== 'number') return
  if (d.url.indexOf('https://www.reddit.com/') !== 0) {
    parent.postMessage({ type: 'jsonp-response', id: d.id, ok: false, error: 'bad url' }, '*')
    return
  }
  var cb = 'cb_' + d.id
  var s = document.createElement('script')
  var done = false
  var finish = function (ok, payload) {
    if (done) return
    done = true
    delete window[cb]
    if (s.parentNode) s.parentNode.removeChild(s)
    parent.postMessage({ type: 'jsonp-response', id: d.id, ok: ok, data: ok ? payload : undefined, error: ok ? undefined : payload }, '*')
  }
  window[cb] = function (data) { finish(true, data) }
  s.onerror = function () { finish(false, 'script error') }
  s.referrerPolicy = 'no-referrer'
  s.src = d.url + (d.url.indexOf('?') === -1 ? '?' : '&') + 'jsonp=' + cb
  document.head.appendChild(s)
})
parent.postMessage({ type: 'jsonp-ready' }, '*')
</scr` + `ipt>`

let iframe: HTMLIFrameElement | null = null
let frameReady = false
const preReadyQueue: any[] = []
let nextID = 1
const pending = new Map<
  number,
  { resolve: (data: any) => void; reject: (e: Error) => void; timer: any }
>()

const settle = (id: number) => {
  const entry = pending.get(id)
  if (entry) {
    pending.delete(id)
    clearTimeout(entry.timer)
  }
  return entry
}

const ensureFrame = () => {
  if (iframe) {
    return
  }
  iframe = document.createElement('iframe')
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.style.display = 'none'
  iframe.setAttribute('aria-hidden', 'true')
  iframe.srcdoc = SHIM_HTML
  window.addEventListener('message', e => {
    if (!iframe || e.source !== iframe.contentWindow) {
      return
    }
    const d: any = e.data || {}
    if (d.type === 'jsonp-ready') {
      frameReady = true
      for (const msg of preReadyQueue.splice(0)) {
        iframe.contentWindow!.postMessage(msg, '*')
      }
    } else if (d.type === 'jsonp-response') {
      const entry = settle(d.id)
      if (!entry) {
        return
      }
      if (d.ok) {
        entry.resolve(d.data)
      } else {
        entry.reject(new Error(`Could not connect to Reddit: jsonp ${d.error}`))
      }
    }
  })
  document.body.appendChild(iframe)
}

// Pacing: reddit rate-flags a browser session (its loid cookie, partitioned
// per top-level site) after enough volume, and page loads otherwise fire
// bursts with nothing throttling the non-api/info calls. One gate here covers
// every jsonp request.
const MAX_CONCURRENT = 5
const SPACING_MS = 150
let active = 0
const waiting: (() => void)[] = []
const acquire = (): Promise<void> =>
  new Promise(resolve => {
    if (active < MAX_CONCURRENT) {
      active++
      resolve()
    } else {
      waiting.push(() => {
        active++
        resolve()
      })
    }
  })
const release = () => {
  setTimeout(() => {
    active--
    const next = waiting.shift()
    if (next) {
      next()
    }
  }, SPACING_MS)
}

const jsonpFetch_nolimit = (url: string): Promise<any> =>
  new Promise((resolve, reject) => {
    ensureFrame()
    const id = nextID++
    const timer = setTimeout(() => {
      if (settle(id)) {
        reject(new Error('Could not connect to Reddit: jsonp timeout'))
      }
    }, JSONP_TIMEOUT_MS)
    pending.set(id, { resolve, reject, timer })
    const msg = { type: 'jsonp-request', id, url }
    if (frameReady && iframe) {
      iframe.contentWindow!.postMessage(msg, '*')
    } else {
      preReadyQueue.push(msg)
    }
  })

export const jsonpFetch = async (url: string): Promise<any> => {
  await acquire()
  try {
    const data = await jsonpFetch_nolimit(url)
    recordTransport('jsonp', 'ok')
    return data
  } catch (e: any) {
    recordTransport(
      'jsonp',
      e?.message?.includes('timeout') ? 'timed out' : 'blocked'
    )
    throw e
  } finally {
    release()
  }
}

// oauth.reddit.com paths omit the .json suffix that www requires
const toWwwJsonUrl = (url: string) => {
  const u = new URL(
    url.startsWith(oauth_reddit)
      ? www_reddit_slash + url.slice(oauth_reddit.length)
      : url
  )
  if (!u.pathname.endsWith('.json')) {
    u.pathname += '.json'
  }
  return u.toString()
}

// Response-like wrapper so existing .then(response => response.json()) chains
// work unchanged. JSONP exposes no status or headers.
const jsonpResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
  headers: { get: (_name: string) => null },
})

// Endpoints reddit's JSONP support cannot serve (script error every time);
// only the extension bridge can. Everything else tries JSONP first so page
// traffic spends the page's own budget, not the extension's monitoring budget.
const BRIDGE_ONLY_PATHS =
  /\/(api\/(user_data_by_account_ids|username_available|morechildren)|moderated_subreddits|about\/(log|spam))\.json$/

// Drop-in replacement for window.fetch on reddit URLs. With a user-supplied
// API key (Settings), oauth.reddit.com requests keep using real fetch, which
// still has healthy CORS; only the token mint died. Everything else
// reddit-bound goes over JSONP, with the extension bridge (bridge.ts) for
// what JSONP cannot serve and as fallback. Non-reddit URLs pass through.
export const redditFetch = (url: string, init: any = {}): Promise<any> => {
  const is_oauth = url.startsWith(oauth_reddit)
  const is_www = url.startsWith(www_reddit_slash)
  if (!is_oauth && !is_www) {
    return window.fetch(url, init)
  }
  if (is_oauth && getCustomClientID()) {
    // record the outcome so the connect-error status line can name a key-path
    // failure (dead key, network) instead of showing every transport untried
    return window.fetch(url, init).then(
      response => {
        recordTransport(
          'apikey',
          response.ok ? 'ok' : `HTTP ${response.status}`
        )
        return response
      },
      e => {
        recordTransport('apikey', 'network error')
        throw e
      }
    )
  }
  const wwwUrl = toWwwJsonUrl(url)
  if (BRIDGE_ONLY_PATHS.test(new URL(wwwUrl).pathname)) {
    return bridgeFetch(wwwUrl).catch(() =>
      jsonpFetch(wwwUrl).then(jsonpResponse)
    )
  }
  return jsonpFetch(wwwUrl)
    .then(jsonpResponse)
    .catch(e => bridgeFetch(wwwUrl).catch(() => Promise.reject(e)))
}
