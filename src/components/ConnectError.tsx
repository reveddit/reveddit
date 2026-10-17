import React from 'react'
import { Link } from 'react-router-dom'
import { get, getCustomClientID } from 'utils'
import ModalContext from 'contexts/modal'
import { RedditOrLocalLink } from 'components/ui/Links'
import { ExtensionLinks, isMobileDevice } from 'components/ui/Extensions'
import { getTransportSummary, getTransportStatus } from 'api/reddit/status'
import { getExtensionVersion, extensionSupportsBridge } from 'api/reddit/bridge'

const whatHappenedLink = (
  <RedditOrLocalLink to="/about/faq/#errors">What happened?</RedditOrLocalLink>
)

// The one connect-failure message, shared by the error modal
// (RevdditFetcher) and the user page so they never drift apart. Branches on
// what would actually reconnect this visitor: turning the extension back on
// when it didn't answer this page (a disabled or removed extension leaves its
// stamps behind, so "installed" alone proves nothing), an extension update for
// the stuck-on-old-version cohort, the store badges for desktop visitors
// without the extension, and a desktop-only note on mobile, where no extension
// can install.
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
  const bridgeStatus = getTransportStatus('bridge')
  const extensionDidNotAnswer = bridgeStatus === 'no response'
  const storeLinks = (
    <div style={{ margin: '15px 0' }}>
      <ExtensionLinks imgStyle={{ height: '48px' }} />
    </div>
  )
  let path
  if (extensionDidNotAnswer) {
    path = (
      <>
        <p>
          Reveddit connects to Reddit through its browser extension, and yours
          didn't answer this page. It may be turned off or removed. Check your
          browser's extensions page, then reload this page, or install it:
        </p>
        {storeLinks}
      </>
    )
  } else if (hasExtension && extensionSupportsBridge()) {
    path = bridgeStatus.startsWith('refused') ? (
      <p>
        Your Reveddit extension answered, but couldn't get this page's data from
        Reddit just now; the status below says why. Try again in a few minutes.
      </p>
    ) : (
      <p>
        This page could not load through your Reveddit extension just now; the
        status below says why. Reload the page to try again.
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
        {storeLinks}
      </>
    )
  }
  // The extension is the way back in, so the key comes second, and only says it
  // failed when it was actually tried
  const apiKeyStatus = getTransportStatus('apikey')
  let apiKeyNote: React.ReactNode = null
  if (hasApiKey && apiKeyStatus !== 'untried' && apiKeyStatus !== 'ok') {
    apiKeyNote = (
      <p>
        Requests using your API key also failed. Verify the key in{' '}
        {settingsLink}.
      </p>
    )
  } else if (!hasApiKey && (!hasExtension || extensionDidNotAnswer)) {
    apiKeyNote = (
      <p>
        If you already have a Reddit API key, adding it in {settingsLink} also
        reconnects this site. Reddit no longer issues new keys.
      </p>
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
      {apiKeyNote}
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
