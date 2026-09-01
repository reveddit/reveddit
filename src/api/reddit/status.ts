// Last-known outcome of each reddit transport, recorded where the attempts
// happen (jsonp.ts, bridge.ts) and read by error UIs, so "could not connect"
// messages can say which paths failed instead of guessing at a cause.
// In-memory only; resets on page load.

export type TransportName = 'jsonp' | 'bridge' | 'apikey'

const status: Record<TransportName, string> = {
  jsonp: 'untried',
  bridge: 'untried',
  apikey: 'untried',
}

export const recordTransport = (name: TransportName, outcome: string) => {
  status[name] = outcome
}

// One line for error UIs. Callers pass extension/API-key state to avoid
// import cycles (bridge.ts imports recordTransport from this module).
export const getTransportSummary = ({
  extensionVersion,
  hasApiKey,
}: {
  extensionVersion: string | null
  hasApiKey: boolean
}): string =>
  `direct reddit: ${status.jsonp} · extension bridge: ` +
  (extensionVersion
    ? `${status.bridge} (v${extensionVersion})`
    : 'not detected') +
  ` · API key: ` +
  (hasApiKey
    ? status.apikey === 'untried'
      ? 'set, untried'
      : status.apikey
    : 'none')
