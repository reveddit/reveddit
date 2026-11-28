import React from 'react'
import { ExtensionLinks } from 'components/ui/Extensions'
import { get, put } from 'utils'
import { Link } from 'react-router-dom'
import { useExtensionStatus } from 'api/reddit/extensionStatus'
import {
  useTransportStatus,
  BRIDGE_UNSUPPORTED_CONTEXT,
} from 'api/reddit/status'

const BANNER_DISMISSED_VAR = 'hasSeenRedditBreakingChangeBanner_2024'
// "Not running" is a problem to fix rather than news, so it shows even after
// the news banner was dismissed, and dismissing it lasts one browser session.
// So does "running, but refused in this window".
const OFF_BANNER_DISMISSED_VAR = 'dismissedExtensionOffBanner'
const WINDOW_BANNER_DISMISSED_VAR = 'dismissedExtensionWindowBanner'

const dismissedThisSession = (key: string): boolean => {
  try {
    return window.sessionStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

const dismissForSession = (key: string, hide: (hidden: boolean) => void) => {
  try {
    window.sessionStorage.setItem(key, 'true')
  } catch {
    // storage blocked: hide it for this page only
  }
  hide(true)
}

export const RedditChangeBanner = () => {
  const extension = useExtensionStatus()
  const bridge = useTransportStatus('bridge')
  const [dismissed, setDismissed] = React.useState(
    get(BANNER_DISMISSED_VAR, false)
  )
  const [offDismissed, setOffDismissed] = React.useState(() =>
    dismissedThisSession(OFF_BANNER_DISMISSED_VAR)
  )
  const [windowDismissed, setWindowDismissed] = React.useState(() =>
    dismissedThisSession(WINDOW_BANNER_DISMISSED_VAR)
  )
  const extensionLink = <Link to="/add-ons/direct">Reveddit Real-Time</Link>
  const whatChanged = (
    <Link to="/about/reddit-change" className="banner-link">
      What changed?
    </Link>
  )

  // Running, but it refused this tab, so "keeps this site connected" would
  // be wrong here. Shows once a page's read is refused.
  if (extension === 'running' && bridge === BRIDGE_UNSUPPORTED_CONTEXT) {
    if (windowDismissed) {
      return null
    }
    return (
      <div className="reddit-change-banner extension-off-banner">
        <div className="banner-content">
          <span className="banner-icon">✗</span>
          <div className="banner-body">
            <span className="banner-text">
              {extensionLink} can't connect this site to Reddit from a Firefox
              private window or container tab. Open this page in a regular
              window, outside any container.
            </span>
          </div>
        </div>
        <a
          className="banner-dismiss pointer"
          onClick={() =>
            dismissForSession(WINDOW_BANNER_DISMISSED_VAR, setWindowDismissed)
          }
        >
          ✖&#xfe0e;
        </a>
      </div>
    )
  }

  if (extension === 'not-running') {
    if (offDismissed) {
      return null
    }
    const dismissOff = () =>
      dismissForSession(OFF_BANNER_DISMISSED_VAR, setOffDismissed)
    return (
      <div className="reddit-change-banner extension-off-banner">
        <div className="banner-content">
          <span className="banner-icon">✗</span>
          <div className="banner-body">
            <span className="banner-text">
              {extensionLink} isn't running in this browser, and this site needs
              it to reach Reddit. Turn it on in your browser's extensions page,
              or reinstall it:
            </span>{' '}
            <span className="banner-actions">
              <ExtensionLinks />
              {whatChanged}
            </span>
          </div>
        </div>
        <a className="banner-dismiss pointer" onClick={dismissOff}>
          ✖&#xfe0e;
        </a>
      </div>
    )
  }

  if (dismissed) {
    return null
  }

  const dismiss = () => {
    put(BANNER_DISMISSED_VAR, true)
    setDismissed(true)
  }

  if (extension === 'running') {
    return (
      <div className="reddit-change-banner extension-on-banner">
        <div className="banner-content">
          <span className="banner-icon">✓</span>
          <div className="banner-body">
            <span className="banner-text">
              {extensionLink} is running and keeps this site connected to
              Reddit, which restricts websites' access to its data.
            </span>{' '}
            <span className="banner-actions">{whatChanged}</span>
          </div>
        </div>
        <a className="banner-dismiss pointer" onClick={dismiss}>
          ✖&#xfe0e;
        </a>
      </div>
    )
  }

  return (
    <div className="reddit-change-banner">
      <div className="banner-content">
        <span className="banner-icon">⚠️</span>
        <div className="banner-body">
          <span className="banner-text">
            Reveddit's website now works through its browser extension, because
            Reddit blocks the site's own requests for most visitors. It also
            alerts you when your own posts and comments are removed:
          </span>{' '}
          <span className="banner-actions">
            <ExtensionLinks />
            {whatChanged}
          </span>
        </div>
      </div>
      <a className="banner-dismiss pointer" onClick={dismiss}>
        ✖&#xfe0e;
      </a>
    </div>
  )
}

export default RedditChangeBanner
