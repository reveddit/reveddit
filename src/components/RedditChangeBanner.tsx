import React from 'react'
import { ExtensionLinks } from 'components/ui/Extensions'
import { get, put } from 'utils'
import { Link } from 'react-router-dom'
import { useExtensionStatus } from 'api/reddit/extensionStatus'

const BANNER_DISMISSED_VAR = 'hasSeenRedditBreakingChangeBanner_2024'
// "Not running" is a problem to fix rather than news, so it shows even after
// the news banner was dismissed, and dismissing it lasts one browser session
const OFF_BANNER_DISMISSED_VAR = 'dismissedExtensionOffBanner'

const dismissedThisSession = (): boolean => {
  try {
    return window.sessionStorage.getItem(OFF_BANNER_DISMISSED_VAR) === 'true'
  } catch {
    return false
  }
}

export const RedditChangeBanner = () => {
  const extension = useExtensionStatus()
  const [dismissed, setDismissed] = React.useState(
    get(BANNER_DISMISSED_VAR, false)
  )
  const [offDismissed, setOffDismissed] = React.useState(dismissedThisSession)
  const extensionLink = <Link to="/add-ons/direct">Reveddit Real-Time</Link>
  const whatChanged = (
    <Link to="/about/reddit-change" className="banner-link">
      What changed?
    </Link>
  )

  if (extension === 'not-running') {
    if (offDismissed) {
      return null
    }
    const dismissOff = () => {
      try {
        window.sessionStorage.setItem(OFF_BANNER_DISMISSED_VAR, 'true')
      } catch {
        // storage blocked: hide it for this page only
      }
      setOffDismissed(true)
    }
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
            Reddit restricts websites' access to its data, which limits
            Reveddit's website and may break it without notice. Install the
            extension for reliable tracking and alerts:
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
