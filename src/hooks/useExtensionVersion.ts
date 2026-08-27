import { useEffect, useState } from 'react'

// The Chrome extension answers {action: 'version'} from any *.reveddit.com
// page via externally_connectable. The handler predates 0.0.5.14, so stuck
// installs can be detected too.
const EXTENSION_ID = 'ickfhlplfbipnfahjbeongebnmojbnhm'

// Highest version considered stuck: ~20% of Chrome installs stopped
// receiving updates in early August 2026 and are frozen at 0.0.5.14.
export const STUCK_MAX_VERSION = '0.0.5.14'

const versionLte = (a: string, b: string): boolean => {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0)
  const pb = b.split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0)
  }
  return true
}

export const isStuckVersion = (version: string | null): boolean =>
  !!version && versionLte(version, STUCK_MAX_VERSION)

// ?stuck_test=1 (or =<version>) forces a value for previewing the
// stuck-version UI without the extension installed.
const getTestVersion = (): string | null => {
  const test = new URLSearchParams(window.location.search).get('stuck_test')
  return test ? (test === '1' ? STUCK_MAX_VERSION : test) : null
}

// Reads the installed extension's version, or null when undetectable
// (Firefox, no extension, non-Chromium).
export const useExtensionVersion = (): string | null => {
  const [version, setVersion] = useState<string | null>(getTestVersion)
  useEffect(() => {
    if (getTestVersion()) {
      return
    }
    try {
      const runtime = (window as any).chrome?.runtime
      if (!runtime?.sendMessage) return
      runtime.sendMessage(EXTENSION_ID, { action: 'version' }, (resp: any) => {
        // lastError must be read to avoid an unchecked-error console warning
        if (runtime.lastError || !resp?.version) return
        setVersion(String(resp.version))
      })
    } catch {
      // chrome.runtime can throw in odd embedder contexts; treat as absent
    }
  }, [])
  return version
}
