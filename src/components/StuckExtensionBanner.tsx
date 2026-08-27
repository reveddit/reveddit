import React from 'react'
import { Link } from 'react-router-dom'

const SESSION_DISMISS_KEY = 'stuckExtensionBannerDismissed'

// Session-only dismissal: a stuck extension is still stuck tomorrow, so the
// banner returns on the next visit until the install actually updates.
const getSessionDismissed = () => {
  try {
    return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

export const StuckExtensionBanner = ({ version }: { version: string }) => {
  const [dismissed, setDismissed] = React.useState(getSessionDismissed)
  if (dismissed) {
    return null
  }
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(SESSION_DISMISS_KEY, 'true')
    } catch {
      // ignore
    }
    setDismissed(true)
  }
  return (
    <div className="reddit-change-banner stuck-extension-banner">
      <div className="banner-content">
        <span className="banner-icon">⚠️</span>
        <span className="banner-text">
          Your reveddit real-time extension is stuck on version {version} and no
          longer updates. Fix: open chrome://extensions, turn on Developer mode
          (top right), press Update.
        </span>
        <Link to="/update-help" className="banner-link">
          Still stuck? Tell us which browser you use
        </Link>
      </div>
      <a className="banner-dismiss pointer" onClick={dismiss}>
        ✖&#xfe0e;
      </a>
    </div>
  )
}

export default StuckExtensionBanner
