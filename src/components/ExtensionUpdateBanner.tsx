import React from 'react'
import { Link } from 'react-router-dom'
import { ExtensionUpdate } from 'hooks/useExtensionUpdate'

// Dismissed for the session and only for this version: a newer one shows again
const dismissKey = (available: string) =>
  `extensionUpdateBannerDismissed_${available}`

const getSessionDismissed = (available: string) => {
  try {
    return window.sessionStorage.getItem(dismissKey(available)) === 'true'
  } catch {
    return false
  }
}

// For a running extension that is behind its store's version. Chrome and Edge
// builds after 0.0.5.24 ask the browser to update as soon as they read the
// same feed, and older ones update within the browser's usual few hours.
// Firefox has no way for an extension to ask, and checks once a day, so its
// users get the steps to update by hand.
export const ExtensionUpdateBanner = ({
  store,
  installed,
  available,
}: ExtensionUpdate) => {
  const [dismissed, setDismissed] = React.useState(() =>
    getSessionDismissed(available)
  )
  if (dismissed) {
    return null
  }
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(dismissKey(available), 'true')
    } catch {
      // storage blocked: hide it for this page only
    }
    setDismissed(true)
  }
  const extensionLink = <Link to="/add-ons/direct">Reveddit Real-Time</Link>
  return (
    <div className="reddit-change-banner extension-update-banner">
      <div className="banner-content">
        <span className="banner-icon">↻</span>
        <div className="banner-body">
          {store === 'firefox' ? (
            <span className="banner-text">
              {extensionLink} {available} is out, and you have {installed}.
              Firefox can take a day to install it on its own, or you can update
              it now:
            </span>
          ) : (
            <span className="banner-text">
              {extensionLink} {available} is out, and you have {installed}. Your
              browser should install it within a few hours.
            </span>
          )}{' '}
          <span className="banner-actions">
            <Link to="/update-help" className="banner-link">
              {store === 'firefox' ? 'How to update' : 'Not updating?'}
            </Link>
          </span>
        </div>
      </div>
      <a className="banner-dismiss pointer" onClick={dismiss}>
        ✖&#xfe0e;
      </a>
    </div>
  )
}

export default ExtensionUpdateBanner
