import React, {useEffect} from 'react'
import {ext_urls, makeDonateVisible, copyLink} from 'utils'
import { InternalPage } from 'components/Misc'

export const meta = {
  'chrome': {
    img: '/images/chrome-store.png',
    att: 'c'
  },
  'firefox': {
    img: '/images/firefox-addon.png',
    att: 'f'
  },
  'subscribe': {
    img: '/images/ext-subscribe.png',
  }
}

const rev = 'Reveddit '
const textContent = {
  'rt': {
    title: rev+'Real-Time',
    description:
      <>
        <p>Notifies you when any of your content on reddit has been removed.</p>
        <p><a href='direct/' onClick={(e) => copyLink(e, true)}>Copy a direct sharelink</a> - copies a link that navigates directly according to the browser.</p>
      </>
  },
  'linker': {
    title: rev+'Linker',
    description: <p>One click icon to jump between viewing content on reddit and reveddit.</p>
  },
  'q': {
    title: rev+'Quarantined',
    description: <p>Allows quarantined content to be viewed on reveddit.</p>
  },
  'rager': {
    title: 'rAger',
    description: <p>Shows the account age and karma for all accounts on reddit pages.</p>
  }
}

const extensionLink = (browser='chrome', extension) => {
  const href = ext_urls[extension][meta[browser].att]
  if (href) {
    return (
      <a className='white' target="_blank" href={href} style={{marginRight:'35px'}}>
        <img alt={`Add to ${browser}`} src={meta[browser].img}/>
      </a>
    )
  }
  return null
}

const linkWrap = (extension) => {
  return (
    <>
      <h2 className='about'>{textContent[extension].title}</h2>
      <div style={{margin:'0 5%'}}>
        <div>{textContent[extension].description}</div>
        {extension === 'rt' &&
          (<div style={{margin:'0 0 15px'}}>
            <img src="/images/screenshot-notification-smaller.png" style={{maxWidth:'100%'}}/>
          </div>)
        }
        <div style={{display:'flex', flexWrap:'wrap'}}>
          {extensionLink('chrome', extension)}
          {extensionLink('firefox', extension)}
        </div>
        {['q'].includes(extension) &&
          <p>This is not necessary if the Real-Time Extension is installed.</p>
        }
      </div>
    </>
  )
}

export default () => {
  useEffect(() => {
    makeDonateVisible()
  }, [])
  return (
    <InternalPage>
      {linkWrap('rt')}
      {linkWrap('linker')}
      {linkWrap('rager')}
      {linkWrap('q')}
    </InternalPage>
  )
}
