import React, {useEffect} from 'react'
import {www_reddit, old_reddit} from 'api/reddit'
import { QuestionMark } from 'pages/common/svg'
import ModalContext from 'contexts/modal'
import Bowser from 'bowser'
import {ext_urls, jumpToHash} from 'utils'
import {meta} from 'pages/about/AddOns'
import { Link } from 'react-router-dom'

const chromelike = ['chrome', 'chromium', 'opera', 'edge', 'vivaldi']
const chromelike_fullnames = {}
chromelike.forEach(name => {
  chromelike_fullnames[Bowser.BROWSER_MAP[name]] = true
})

const bp = Bowser.getParser(window.navigator.userAgent)
const browserName = bp.getBrowserName()

let browserExtensionImage = ''
if (chromelike_fullnames[browserName]) {
  browserExtensionImage = <img alt="Add to Chrome" src={meta.chrome.img}/>
} else if (Bowser.BROWSER_MAP['firefox'] == browserName) {
  browserExtensionImage = <img alt="Add to Firefox" src={meta.firefox.img}/>
}

export const RedditOrLocalLink = ({children, reddit, to}) => {
  if (reddit) {
    return <NewWindowLink reddit={reddit}>{children}</NewWindowLink>
  } else if (to) {
    return <LinkWithCloseModal to={to}>{children}</LinkWithCloseModal>
  }
  return null
}

export const NewWindowLink = ({children, reddit, old=false, ...props}) => {
  let href
  if (reddit) {
    if (! old) {
      href = www_reddit
    } else {
      href = old_reddit
    }
    href += reddit
  } else {
    href = props.href
  }
  return <a href={href} target='_blank' rel='noopener' {...props}>{children}</a>
}

export const LinkWithCloseModal = ({children, to}) => {
  const modal = React.useContext(ModalContext)
  return <Link to={to} onClick={modal.closeModal}>{children}</Link>
}

export const ExtensionLink = ({image = false}) => {
  let content = 'Reveddit Real-Time'
  if (image) {
    content = browserExtensionImage
  }
  if (chromelike_fullnames[browserName]) {
    return <NewWindowLink href={ext_urls.rt.c}>{content}</NewWindowLink>
  } else if (Bowser.BROWSER_MAP['firefox'] == browserName) {
    return <NewWindowLink href={ext_urls.rt.f}>{content}</NewWindowLink>
  }
  return <LinkWithCloseModal to='/add-ons/'>{content}</LinkWithCloseModal>
}

const getExtensionURL = () => {
  if (chromelike_fullnames[browserName]) {
    return ext_urls.rt.c
  } else if (Bowser.BROWSER_MAP['firefox'] == browserName) {
    return ext_urls.rt.f
  }
  return '/add-ons/'
}

export const ExtensionRedirect = () => {
  useEffect(() => {
    window.location.replace(getExtensionURL())
  }, [])
  return null
}

export const Spin = ({width}) => {
  const spin = <img className='spin' alt='spin' width={width} src='/images/spin.gif'/>
  if (! width) {
    return <div className='non-item'>{spin}</div>
  }
  return spin
}

export const MessageMods = ({permalink, subreddit}) => {
  const mods_message_body = '\n\n\n'+www_reddit+permalink
  const mods_link = '/message/compose?to=/r/'+subreddit+'&message='+encodeURI(mods_message_body)
  return <NewWindowLink reddit={mods_link} target="_blank">message mods</NewWindowLink>
}

//modalContent should be either {content: <>abc</>} or {hash: 'abc'}
export const QuestionMarkModal = ({modalContent, fill, text, wh='20'}) => {
  const modal = React.useContext(ModalContext)
  return (
    <a className='pointer' onClick={() => modal.openModal(modalContent)}>
      { text ? text :
        <QuestionMark style={{marginLeft: '10px'}} wh={wh} fill={fill}/>
      }
    </a>
  )
}

export const InternalPage = ({children}) => {
  useEffect(() => {
    jumpToHash(window.location.hash, 0)
  }, [])
  return (
    <div id='main'>
      <div id='main-box'>
        {children}
      </div>
    </div>
  )
}

export const Help = ({title = '', content = ''}) => {
  return (
    <div>
      <h3>{title} help</h3>
      {content}
    </div>
  )
}
