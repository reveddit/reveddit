import React from 'react'
import { NewWindowLink } from 'components/ui/Links'
import {
  ExtensionLinks,
  redditChangePostUrl,
} from 'components/ui/Extensions'
import { get, put } from 'utils'
import { Link } from 'react-router-dom'

const BANNER_DISMISSED_VAR = 'hasSeenRedditBreakingChangeBanner_2024'

export const RedditChangeBanner = () => {
  const [dismissed, setDismissed] = React.useState(
    get(BANNER_DISMISSED_VAR, false)
  )
  const hasExtension = get('hasNotifierExtension', false)

  if (dismissed) {
    return null
  }

  const dismiss = () => {
    put(BANNER_DISMISSED_VAR, true)
    setDismissed(true)
  }

  return (
    <div className="reddit-change-banner">
      <div className="banner-content">
        <span className="banner-icon">⚠️</span>
        <span className="banner-text">
          Reddit changed how removals work, which breaks Reveddit's website.
          {hasExtension ? (
            <>
              {' '}
              <Link
                to="/add-ons/direct"
                style={{ color: 'white', textDecoration: 'underline' }}
              >
                Reveddit's extension
              </Link>
              , which you have installed, continues to work.
            </>
          ) : (
            <> Install the extension to track removed content:</>
          )}
        </span>
        {!hasExtension && <ExtensionLinks />}
        <NewWindowLink href={redditChangePostUrl} className="banner-link">
          What changed?
        </NewWindowLink>
      </div>
      <a className="banner-dismiss pointer" onClick={dismiss}>
        ✖&#xfe0e;
      </a>
    </div>
  )
}

export default RedditChangeBanner
