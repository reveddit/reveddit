import React, {useEffect} from 'react'
import {www_reddit, old_reddit} from 'api/reddit'
import { QuestionMark, TwitterBlue } from 'pages/common/svg'
import ModalContext from 'contexts/modal'
import Bowser from 'bowser'
import {ext_urls, jumpToHash, copyLink, SimpleURLSearchParams} from 'utils'
import {meta} from 'pages/about/AddOns'
import { Link } from 'react-router-dom'
import { newUserModal } from 'pages/modals/Misc'

const chromelike = ['chrome', 'chromium', 'opera', 'edge', 'vivaldi']
const chromelike_fullnames = {}
chromelike.forEach(name => {
  chromelike_fullnames[Bowser.BROWSER_MAP[name]] = true
})

const bp = Bowser.getParser(window.navigator.userAgent)
const browserName = bp.getBrowserName()

const isChrome = !! chromelike_fullnames[browserName]
const isFirefox = !! (Bowser.BROWSER_MAP['firefox'] == browserName)

export const is_iOS = (
  [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
)

export const iOS_shortcut_link = <a href='https://www.icloud.com/shortcuts/d18cb266c9b6494faf8aef38ab60c607'>iOS shortcut</a>

let browserExtensionImage = ''
if (isChrome) {
  browserExtensionImage = <img alt="Add to Chrome" src={meta.chrome.img}/>
} else if (isFirefox) {
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

export const SamePageHashLink = ({id, children, ...props}) => {
  const hash='#'+id
  return <Link to={hash} onClick={() => jumpToHash(hash)} {...props}>{children}</Link>
}

export const NewWindowLink = ({children, reddit, old=false, redesign=false, ...props}) => {
  let href
  if (reddit) {
    if (old) {
      href = old_reddit
    } else if (redesign) {
      href = 'https://new.reddit.com'
    } else {
      href = www_reddit
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

export const ExtensionLink = ({image = false, extensionID = 'rt'}) => {
  const extensionMeta = ext_urls[extensionID]
  let content = extensionMeta.n
  if (image) {
    content = browserExtensionImage
  }
  if (isChrome) {
    return <NewWindowLink href={extensionMeta.c}>{content}</NewWindowLink>
  } else if (isFirefox) {
    return <NewWindowLink href={extensionMeta.f}>{content}</NewWindowLink>
  }
  return <LinkWithCloseModal to='/add-ons/'>{content}</LinkWithCloseModal>
}

const getExtensionURL = (extCode='rt') => {
  if (extCode in ext_urls) {
    if (isChrome) {
      return ext_urls[extCode].c
    } else if (isFirefox) {
      return ext_urls[extCode].f
    }
  }
  return '/add-ons/'
}

export const ExtensionRedirect = ({extCode = 'rt'}) => {
  useEffect(() => {
    window.location.replace(getExtensionURL(extCode))
  }, [])
  return null
}

export const Tip = ({children}) => <p><span className='quarantined'>Tip</span> {children}</p>

export const Spin = ({width}) => {
  const spin = <img className='spin' alt='spin' width={width} src='/images/spin.gif'/>
  if (! width) {
    return <div className='non-item'>{spin}</div>
  }
  return spin
}

export const MessageMods = ({permalink, subreddit = '', message_body = '', innerText = 'message mods', message_subject = ''}) => {
  const mods_message_body = message_body || '\n\n\n'+www_reddit+permalink
  const search = new SimpleURLSearchParams().setParams({
    to: '/r/'+subreddit,
    message: mods_message_body,
    ...(message_subject && {subject: message_subject}),
  })
  const mods_link = '/message/compose'+search.toString()
  return <NewWindowLink reddit={mods_link} target="_blank">{innerText}</NewWindowLink>
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
export const buttonClasses = 'pointer bubble medium lightblue'

export const ModalWithButton = ({text, title, buttonText, buttonFn, children}) => {
  const modal = React.useContext(ModalContext)
  return (
    <a className='pointer' onClick={() => modal.openModal({content:
      <StructuredContent {...{title: title || text,
                              content:
                              <>
                                {children}
                                <p style={{textAlign:'center'}}>
                                  <a className={buttonClasses} onClick={() => {
                                    modal.closeModal()
                                    buttonFn()
                                  }}>{buttonText}</a>
                                </p>
                              </>}}/>})}>
      {text}
    </a>
  )
}

export const InternalPage = ({children, props}) => {
  useEffect(() => {
    if (props) {
      newUserModal(props)
    }
    // Wait for images to render
    setTimeout(() => jumpToHash(location.hash, 0), 500)
  }, [])
  return (
    <div id='main'>
      <div id='main-box'>
        {children}
      </div>
    </div>
  )
}

export const HelpModal = ({title = '', content = '', fill}) => {
  return <QuestionMarkModal fill={fill} modalContent={{content: <Help {...{title, content}}/>}} />
}

export const Help = ({title = '', content = ''}) => {
  return <StructuredContent {...{title: title + ' help', content}}/>
}

const StructuredContent = ({title = '', content = ''}) => {
  return (
    <div>
      <h3>{title}</h3>
      {content}
    </div>
  )
}

export const ShareLink = ({href, useHref=true}) => {
  return (
    <div className="revddit-sharing">
      <a href={href} onClick={(e) => copyLink(e, useHref)}>copy sharelink</a>
    </div>
  )

}

export const SocialLinks = () => {
  return (
    <div style={{textAlign:'center', marginTop:'10px'}}>
      <TwitterBlue wh='20' style={{marginRight:'25px'}}/>
      <NewWindowLink style={{marginRight:'25px'}} reddit='/r/reveddit'>r/reveddit</NewWindowLink>
      <NewWindowLink href='https://removed.substack.com'>removed.substack.com</NewWindowLink>
    </div>
  )
}

const submitUsername = (e) => {
  e.preventDefault()
  const data = new FormData(e.target)
  const username = data.get('username').trim().replace(/^u(?:ser)?\//i, '')
  if (username) {
    window.open(`/u/${username}?all=true`, '_blank').focus()
  }
}
export const UserNameEntry = (props) => <div className='user-lookup'>
<form onSubmit={submitUsername} {...props}>
  <input type='text' placeholder='username' name='username'/>
  <input type='submit' value='go' />
  <span> (check your username's removed content. <a href='/about/faq/#need' target='_blank'>why?</a>)</span>
</form>
</div>
