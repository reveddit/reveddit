import React from 'react'
import { Link } from 'react-router-dom'
import { get, getCustomClientID } from 'utils'
import ModalContext from 'contexts/modal'
import { RedditOrLocalLink } from 'components/ui/Links'
import { ExtensionLinks, isMobileDevice } from 'components/ui/Extensions'
import { getTransportSummary } from 'api/reddit/status'
import { getExtensionVersion, extensionSupportsBridge } from 'api/reddit/bridge'

const whatHappenedLink = (
  <RedditOrLocalLink to="/about/faq/#errors">What happened?</RedditOrLocalLink>
)

// The one connect-failure message, shared by the error modal
// (RevdditFetcher) and the user page so they never drift apart. Branches on
// what would actually reconnect this visitor: an extension update for the
// stuck-on-old-version cohort, the store badges for desktop visitors without
// the extension, and a desktop-only note on mobile, where no extension can
// install.
export const ConnectErrorContent = ({ pageError = '' }) => {
  const modal = React.useContext(ModalContext)
  const extensionVersion = getExtensionVersion()
  const hasExtension =
    Boolean(extensionVersion) || get('hasNotifierExtension', false)
  const hasApiKey = Boolean(getCustomClientID())
  const settingsLink = (
    <Link to="#settings" onClick={() => modal.openModal({ hash: 'settings' })}>
      settings
    </Link>
  )
  let path
  if (hasExtension && extensionSupportsBridge()) {
    path = (
      <p>
        Your installed Reveddit extension is unaffected and continues to track
        removed content. This page could not load through it just now; the
        status below says why.
      </p>
    )
  } else if (hasExtension) {
    path = (
      <p>
        Your installed Reveddit extension continues to track removed content,
        but connecting this website through it needs version 0.0.5.21 or newer.
        Yours has not updated: see{' '}
        <RedditOrLocalLink to="/update-help/">update help</RedditOrLocalLink>.
      </p>
    )
  } else if (isMobileDevice) {
    path = (
      <p>
        Reveddit now needs its desktop browser extension (Chrome, Edge, or
        Firefox) to connect to Reddit. The extension tracks removals of your own
        content in real time and notifies you. There is currently no way to
        connect from a mobile browser.
      </p>
    )
  } else {
    path = (
      <>
        <p>
          The Reveddit Real-Time extension reconnects this site. It also tracks
          removals of your own content in real time and notifies you:
        </p>
        <div style={{ margin: '15px 0' }}>
          <ExtensionLinks imgStyle={{ height: '48px' }} />
        </div>
      </>
    )
  }
  return (
    <>
      <p>Could not connect to Reddit.</p>
      <p>
        Reddit restricts websites' access to its data, and the public access
        Reveddit relies on can change without notice (see: {whatHappenedLink})
      </p>
      {path}
      <p>
        {hasApiKey ? (
          <>
            Requests using your API key failed. Verify the key in {settingsLink}
            , or try again in a few minutes.
          </>
        ) : (
          <>
            If you already have a Reddit API key, adding it in {settingsLink}{' '}
            also reconnects this site. Reddit no longer issues new keys.
          </>
        )}
      </p>
      <p style={{ opacity: 0.7 }}>
        {getTransportSummary({
          extensionVersion,
          hasApiKey,
        })}
        {pageError ? ` · page error: ${pageError}` : ''}
      </p>
    </>
  )
}
