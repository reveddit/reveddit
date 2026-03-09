import React, { useEffect } from 'react'
import Bowser from 'bowser'
import { ext_urls } from 'utils'
import { meta } from 'pages/about/AddOns'
import { NewWindowLink, LinkWithCloseModal } from 'components/ui/Links'

const chromelike = ['chrome', 'chromium', 'opera', 'edge', 'vivaldi']
const chromelike_fullnames = {}
chromelike.forEach(name => {
  chromelike_fullnames[Bowser.BROWSER_MAP[name]] = true
})

const bp = Bowser.getParser(window.navigator.userAgent)
const browserName = bp.getBrowserName()

const isChrome = !!chromelike_fullnames[browserName]
const isFirefox = !!(Bowser.BROWSER_MAP['firefox'] == browserName)

export const is_iOS =
  [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod',
  ].includes(navigator.platform) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document)

export const iOS_shortcut_link = (
  <a href="https://www.icloud.com/shortcuts/d18cb266c9b6494faf8aef38ab60c607">
    iOS shortcut
  </a>
)

let browserExtensionImage = ''
if (isChrome) {
  browserExtensionImage = <img alt="Add to Chrome" src={meta.chrome.img} />
} else if (isFirefox) {
  browserExtensionImage = <img alt="Add to Firefox" src={meta.firefox.img} />
}

export const redditChangePostUrl =
  'https://www.reddit.com/r/reveddit/comments/1ngch51/'

export const ExtensionLink = ({ image = false, extensionID = 'rt' }) => {
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
  return <LinkWithCloseModal to="/add-ons/">{content}</LinkWithCloseModal>
}

export const ExtensionLinks = ({ containerStyle = {}, linkStyle = {} }) => {
  const extensionLink = browser => {
    const href = ext_urls.rt[meta[browser].att]
    if (href) {
      return (
        <a
          target="_blank"
          rel="noopener"
          href={href}
          style={{ marginRight: '10px', ...linkStyle }}
        >
          <img
            alt={`Add to ${browser}`}
            src={meta[browser].img}
            style={{ height: '24px', verticalAlign: 'middle' }}
          />
        </a>
      )
    }
    return null
  }
  return (
    <span style={containerStyle}>
      {extensionLink('chrome')}
      {extensionLink('firefox')}
    </span>
  )
}

const getExtensionURL = (extCode = 'rt') => {
  if (extCode in ext_urls) {
    if (isChrome) {
      return ext_urls[extCode].c
    } else if (isFirefox) {
      return ext_urls[extCode].f
    }
  }
  return '/add-ons/'
}

export const ExtensionRedirect = ({ extCode = 'rt' }) => {
  useEffect(() => {
    window.location.replace(getExtensionURL(extCode))
  }, [])
  return null
}
