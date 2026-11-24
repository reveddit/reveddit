import React from 'react'
import { Notice } from 'components/common/Notice'
import { ExtensionLinks, isMobileDevice } from 'components/ui/Extensions'
import { useExtensionStatus } from 'api/reddit/extensionStatus'

// The Overview and Comments tabs: Reddit no longer shows which of a profile's
// comments were removed, to others or to their author. Through the extension,
// the visitor's own comments its monitoring confirmed removed are marked
// (user.ts); otherwise these tabs mark none. Posts are still listed there,
// marked.
export const RemovedCommentsNote = ({ user }: { user: string }) => {
  const running = useExtensionStatus() === 'running'
  const why = `Reddit no longer shows which of a profile's comments were removed. Other people don't see them, and their author sees them as if nothing happened`
  const cant = `${why}, so this page can't mark which of u/${user}'s were removed.`
  let message = `${cant} To be told when your own comments or posts are removed, and see them marked on your profile here, install Reveddit Real-Time.`
  let links = (
    <div style={{ margin: '10px 0' }}>
      <ExtensionLinks imgStyle={{ height: '40px' }} />
    </div>
  )
  if (running) {
    message = `${why}. On your own profile, this page marks the ones Reveddit Real-Time found removed.`
    links = null
  } else if (isMobileDevice) {
    message = `${cant} Reveddit Real-Time, a browser extension for desktop (Chrome, Edge or Firefox), tells you when your own comments or posts are removed.`
    links = null
  }
  return <Notice title="Removed comments" message={message} htmlLink={links} />
}
