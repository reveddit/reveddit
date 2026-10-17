import React from 'react'
import { ExtensionLinks } from 'components/ui/Extensions'
import { useExtensionStatus } from 'api/reddit/extensionStatus'
import { Link } from 'react-router-dom'

export const RedditBreakingChange = () => {
  const extension = useExtensionStatus()
  const storeLinks = (
    <ExtensionLinks
      containerStyle={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: '15px',
      }}
      linkStyle={{ marginRight: '15px' }}
    />
  )

  return (
    <>
      <h3>Important: Reddit Changed How Removals Work</h3>
      <p>
        A recent Reddit update makes mod-removed content disappear from profile
        pages, which breaks Reveddit's website.
      </p>
      {extension === 'running' ? (
        <p>
          <Link to="/add-ons/direct">Reveddit's extension</Link>, which you have
          installed, continues to work.
        </p>
      ) : extension === 'not-running' ? (
        <>
          <p>
            <Link to="/add-ons/direct">Reveddit's extension</Link> isn't running
            in this browser. Turn it on in your browser's extensions page, or
            reinstall it:
          </p>
          {storeLinks}
        </>
      ) : (
        <>
          <p>Install the browser extension to receive removal alerts.</p>
          {storeLinks}
        </>
      )}
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        <Link to="/about/reddit-change">What changed?</Link>
      </p>
    </>
  )
}

export default RedditBreakingChange
