// Last-known outcome of each reddit transport, recorded where the attempts
// happen (jsonp.ts, bridge.ts) and read by error UIs, so "could not connect"
// messages can say which paths failed instead of guessing at a cause.
// In-memory only; resets on page load.

import {
  getShownExtensionStatus,
  getKnownExtensionVersion,
} from './extensionStatus'

export type TransportName = 'jsonp' | 'bridge' | 'apikey'

const status: Record<TransportName, string> = {
  jsonp: 'untried',
  bridge: 'untried',
  apikey: 'untried',
}

export const recordTransport = (name: TransportName, outcome: string) => {
  status[name] = outcome
}

export const getTransportStatus = (name: TransportName): string => status[name]

// One line for error UIs. The caller passes API-key state to avoid an import
// cycle with utils.
export const getTransportSummary = ({
  hasApiKey,
}: {
  hasApiKey: boolean
}): string => {
  const shown = getShownExtensionStatus()
  const v = getKnownExtensionVersion()
  const extension =
    shown === 'running'
      ? `running${v ? ` (v${v})` : ''}`
      : shown === 'not-running'
        ? `not running${v ? ` (last seen v${v})` : ''}`
        : 'not detected'
  return (
    `direct reddit: ${status.jsonp} · extension: ${extension} · bridge: ` +
    `${status.bridge} · API key: ` +
    (hasApiKey
      ? status.apikey === 'untried'
        ? 'set, untried'
        : status.apikey
      : 'none')
  )
}
