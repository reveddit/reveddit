import React from 'react'
import { Link } from 'react-router-dom'
import { getCustomClientID } from 'utils'
import ModalContext from 'contexts/modal'
import { RedditOrLocalLink } from 'components/ui/Links'
import { ExtensionLinks, isMobileDevice } from 'components/ui/Extensions'
import { getTransportSummary, getTransportStatus } from 'api/reddit/status'
import { extensionSupportsBridge } from 'api/reddit/bridge'
import { useExtensionStatus } from 'api/reddit/extensionStatus'

const whatHappenedLink = (
  <RedditOrLocalLink to="/about/faq/#errors">What happened?</RedditOrLocalLink>
)

// The one connect-failure message, shared by the error modal
// (RevdditFetcher) and the user page so they never drift apart. It leads with
// the extension, the only way most visitors still reach Reddit, as the landing
// page does: green when it's running (so something else failed), red when it
// ran in this browser before but isn't running now, an update for the
// stuck-on-old-version cohort, the store badges for visitors who never had it,
// and a desktop-only note on mobile, where no extension can install.
export const ConnectErrorContent = ({ pageError = '' }) => {
  const modal = React.useContext(ModalContext)
  const extension = useExtensionStatus()
  const hasApiKey = Boolean(getCustomClientID())
  const bridgeStatus = getTransportStatus('bridge')
  const settingsLink = (
    <Link to="#settings" onClick={() => modal.openModal({ hash: 'settings' })}>
      settings
    </Link>
  )
  const storeLinks = (
    <div style={{ margin: '15px 0' }}>
      <ExtensionLinks imgStyle={{ height: '48px' }} />
    </div>
  )
  let path
  if (extension === 'not-running') {
    path = (
      <>
        <p className="extension-status off">
          ✗ Reveddit Real-Time isn't running in this browser.
        </p>
        <p>
          This site reaches Reddit through it. It may be turned off or removed:
          turn it on in your browser's extensions page and reload this page, or
          reinstall it:
        </p>
        {storeLinks}
      </>
    )
  } else if (extension === 'running' && !extensionSupportsBridge()) {
    path = (
      <p>
        Your installed Reveddit extension continues to track removed content,
        but connecting this website through it needs version 0.0.5.21 or newer.
        Yours has not updated: see{' '}
        <RedditOrLocalLink to="/update-help/">update help</RedditOrLocalLink>.
      </p>
    )
  } else if (extension === 'running') {
    path = (
      <>
        <p className="extension-status on">✓ Reveddit Real-Time is running.</p>
        <p>
          {bridgeStatus === 'no response'
            ? "It didn't answer this page, though. Reload the page, and if that keeps happening, restart your browser."
            : bridgeStatus.startsWith('refused')
              ? "It couldn't get this page's data from Reddit just now; the status below says why. Try again in a few minutes."
              : 'This page could not load through it just now; the status below says why. Reload the page to try again.'}
        </p>
      </>
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
  } else if (!hasApiKey && extension !== 'running') {
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
        {getTransportSummary({ hasApiKey })}
        {pageError ? ` · page error: ${pageError}` : ''}
      </p>
    </>
  )
}
