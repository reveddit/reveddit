import React from 'react'
import { Link } from 'react-router-dom'
import { InternalPage } from 'components/Misc'
import { NewWindowLink } from 'components/ui/Links'
import Time from 'components/common/Time'
import { ContentWithHeader, Row } from 'pages/about'

const title = "Reddit's login screen and the Reveddit extension"

const About_redditLogin = props => {
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
            <Time created_utc={1793318400} />
          </p>
          <p>
            Reddit{' '}
            <NewWindowLink reddit="/user/spez/comments/1xiupm0/about_that_login_screen/">
              announced
            </NewWindowLink>{' '}
            that it is becoming a mostly logged-in site. It will test the change
            first in some countries outside the U.S.
          </p>
          <h3>Why the extension needs a second account</h3>
          <p>
            Reddit shows you your own removed posts and comments as if nothing
            happened. So the{' '}
            <Link to="/add-ons/direct">Reveddit extension</Link> checks your
            content the way other people see it. It has done that by looking at
            your profile without your login. Where Reddit asks for a login
            before it shows a profile, the extension looks through a second
            Reddit account instead.
          </p>
          <h3>About the second account</h3>
          <p>
            It only reads: it never posts, votes or joins anything. You sign in
            to it on Reddit's own login page, so your password stays with
            Reddit. Use an account that isn't your main one, isn't a moderator
            where you post, and that you haven't blocked, so it sees what
            everyone else sees. You can connect or disconnect it in the
            extension's options.
          </p>
          <h3>If something looks wrong</h3>
          <p>
            Use <b>report a problem</b> at the bottom of the extension's popup.
            It opens a short GitHub form and copies the extension's diagnostic
            log for you to paste.
          </p>
        </ContentWithHeader>
      </Row>
    </InternalPage>
  )
}

export default About_redditLogin
