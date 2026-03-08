import React from 'react'
import { www_reddit, old_reddit } from 'api/reddit'
import ModalContext from 'contexts/modal'
import { jumpToHash } from 'utils'
import { Link } from 'react-router-dom'

export const NewWindowLink = ({
  children,
  reddit,
  short = false,
  old = false,
  redesign = false,
  ...props
}) => {
  let href
  if (reddit) {
    if (old) {
      href = old_reddit
    } else if (redesign) {
      href = 'https://new.reddit.com'
    } else if (short) {
      href = 'https://redd.it'
    } else {
      href = www_reddit
    }
    href += reddit
  } else {
    href = props.href
  }
  return (
    <a href={href} target="_blank" rel="noopener" {...props}>
      {children}
    </a>
  )
}

export const LinkWithCloseModal = ({ children, to }) => {
  const modal = React.useContext(ModalContext)
  return (
    <Link to={to} onClick={modal.closeModal}>
      {children}
    </Link>
  )
}

export const RedditOrLocalLink = ({ children, reddit, to }) => {
  if (reddit) {
    return <NewWindowLink reddit={reddit}>{children}</NewWindowLink>
  } else if (to) {
    return <LinkWithCloseModal to={to}>{children}</LinkWithCloseModal>
  }
  return null
}

export const SamePageHashLink = ({
  id,
  children,
  onClick = () => {},
  ...props
}) => {
  const hash = '#' + id
  return (
    <Link
      to={hash}
      onClick={() => {
        jumpToHash(hash)
        onClick()
      }}
      {...props}
    >
      {children}
    </Link>
  )
}

export const ShareLink = ({ href, useHref = true }) => {
  return (
    <div className="revddit-sharing">
      <a href={href} onClick={e => copyLink(e, useHref)}>
        copy sharelink
      </a>
    </div>
  )
}

// Re-import copyLink lazily to avoid circular dependency with utils
import { copyLink } from 'utils'
