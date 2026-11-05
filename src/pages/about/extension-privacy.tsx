import React from 'react'
import { Link } from 'react-router-dom'
import { InternalPage } from 'components/Misc'
import { NewWindowLink } from 'components/ui/Links'
import { ContentWithHeader, Row } from 'pages/about'

const title = 'Reveddit Real-Time extension privacy'

// Linked from the browser stores' privacy-policy fields, not from the site
const About_extensionPrivacy = props => {
  return (
    <InternalPage props={props}>
      <Row>
        <ContentWithHeader header={title}>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginTop: '-4px',
              fontSize: '0.9em',
            }}
          >
            Last updated November 5, 2026
          </p>
          <p>
            This covers the <Link to="/add-ons/direct">Reveddit Real-Time</Link>{' '}
            browser extension. The reveddit.com website has its own{' '}
            <Link to="/about/contact/#privacy">privacy policy</Link>.
          </p>
          <h3>What it keeps, in your browser</h3>
          <ul>
            <li>Your settings.</li>
            <li>Your Reddit username, and any others you subscribe to.</li>
            <li>
              The posts and comments it checks for you, with their text and a
              history of what happened to them.
            </li>
            <li>A copy of your Reddit login, so its checks keep working.</li>
            <li>
              If you connect one, the login of a second Reddit account it checks
              through.
            </li>
            <li>
              A diagnostic log of its checks. Copies of it leave out your
              username unless you include it, and list the ids of your recent
              posts and comments unless you hide them.
            </li>
          </ul>
          <h3>Where it goes</h3>
          <ul>
            <li>
              Your Reddit logins are only ever sent to reddit.com, to read
              Reddit as you or as your second account.
            </li>
            <li>
              Your settings, the lists of items you follow, and each item's
              status and recent changes use your browser's own sync, if you have
              it turned on.
            </li>
            <li>
              Reveddit pages you open can ask the extension to load Reddit data
              for them. It reads that data with your Reddit login, and hands the
              data, never the login, to the page in your browser.
            </li>
            <li>
              The extension downloads a small settings file from reveddit.com.
              Besides asking Reddit about the items it checks, it sends nothing
              about you to Reveddit or anyone else on its own: no analytics and
              no tracking. Links you open to reveddit.com carry the ids or
              username they show.
            </li>
            <li>
              The diagnostic log only leaves your browser if you copy it
              yourself, for example into a problem report.
            </li>
          </ul>
          <h3>Removing it</h3>
          <p>
            Disconnecting the second account in the extension's options deletes
            its saved login. Uninstalling the extension removes what it stored
            in your browser. A synced copy may stay with your browser account
            and come back if you reinstall.
          </p>
          <h3>Questions</h3>
          <p>
            Ask on{' '}
            <NewWindowLink href="https://github.com/reveddit/real-time-extension/issues">
              GitHub
            </NewWindowLink>
            .
          </p>
        </ContentWithHeader>
      </Row>
    </InternalPage>
  )
}

export default About_extensionPrivacy
