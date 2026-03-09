// Components that remain directly in Misc:
//   Tip, Spin, MessageMods, SocialLinks, InternalPage, UserNameEntry
// All other components have moved to focused submodules:
//   components/ui/Links     – NewWindowLink, LinkWithCloseModal, RedditOrLocalLink, SamePageHashLink, ShareLink
//   components/ui/Extensions – ExtensionLink, ExtensionLinks, ExtensionRedirect, is_iOS, iOS_shortcut_link, redditChangePostUrl
//   components/ui/Modals    – QuestionMarkModal, ModalWithButton, HelpModal, Help, buttonClasses

import React, { useEffect } from 'react'
import { www_reddit } from 'api/reddit'
import { TwitterWhite } from 'components/common/svg'
import { SimpleURLSearchParams, jumpToHash } from 'utils'
import { newUserModal } from 'components/modals/Misc'
import { NewWindowLink } from 'components/ui/Links'

// Components that remain here (small, fewer imports, or cross-cutting)

export const Tip = ({ children }) => (
  <p>
    <span className="quarantined">Tip</span> {children}
  </p>
)

export const Spin = ({ width = '' }) => {
  const style = width ? { width, height: width } : undefined
  const spin = <div className="spinner" style={style} />
  if (!width) {
    return <div className="non-item">{spin}</div>
  }
  return spin
}

export const MessageMods = ({
  permalink = '',
  subreddit = '',
  message_body = '',
  innerText = 'message mods',
  message_subject = '',
}) => {
  const mods_message_body = message_body || '\n\n\n' + www_reddit + permalink
  const search = new SimpleURLSearchParams().setParams({
    to: '/r/' + subreddit,
    message: mods_message_body,
    ...(message_subject && { subject: message_subject }),
  })
  const mods_link = '/message/compose' + search.toString()
  return (
    <NewWindowLink reddit={mods_link} target="_blank">
      {innerText}
    </NewWindowLink>
  )
}

export const InternalPage = ({ children, props = undefined }) => {
  useEffect(() => {
    if (props) {
      newUserModal(props)
    }
    // Wait for images to render
    setTimeout(() => jumpToHash(location.hash, 0), 500)
  }, [])
  return (
    <div id="main">
      <div id="main-box">{children}</div>
    </div>
  )
}

export const SocialLinks = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '10px' }}>
      <TwitterWhite wh="20" style={{ marginRight: '25px' }} />
      <NewWindowLink style={{ marginRight: '25px' }} reddit="/r/reveddit">
        r/reveddit
      </NewWindowLink>
      <NewWindowLink href="https://removed.substack.com">
        removed.substack.com
      </NewWindowLink>
    </div>
  )
}

const submitUsername = e => {
  e.preventDefault()
  const data = new FormData(e.target)
  const username = (data
    .get('username') as string)
    .trim()
    .replace(/^u(?:ser)?\//i, '')
  if (username) {
    window.open(`/u/${username}?all=true`, '_blank').focus()
  }
}
export const UserNameEntry = props => (
  <div className="user-lookup">
    <form onSubmit={submitUsername} {...props}>
      <input type="text" placeholder="username" name="username" />
      <input type="submit" value="go" />
      <span>
        {' '}
        (check your username's removed content.{' '}
        <a href="/about/faq/#need" target="_blank">
          why?
        </a>
        )
      </span>
    </form>
  </div>
)
