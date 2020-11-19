import React, {useEffect} from 'react'
import {ext_urls, makeDonateVisible} from 'utils'

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
    description: 'Notifies you when any of your content on reddit has been removed.'
  },
  'linker': {
    title: rev+'Linker',
    description: 'One click icon to jump between viewing content on reddit and reveddit.'
  },
  'q': {
    title: rev+'Quarantined',
    description: 'Allows quarantined content to be viewed on reveddit.'
  }
}

const extensionLink = (browser='chrome', extension) => {
  return (
    <a className='white' target="_blank" href={ext_urls[extension][meta[browser].att]} style={{marginRight:'35px'}}>
      <img alt={`Add to ${browser}`} src={meta[browser].img}/>
    </a>
  )
}

const linkWrap = (extension) => {
  return (
    <>
      <h2 className='about'>{textContent[extension].title}</h2>
      <div style={{margin:'0 5%'}}>
        <div style={{paddingBottom:'10px'}}>{textContent[extension].description}</div>
        {extension === 'rt' &&
          (<div style={{margin:'15px 0'}}>
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
    <div id='main'>
      <div id='main-box'>
        {linkWrap('rt')}
        {linkWrap('linker')}
        {linkWrap('q')}
      </div>
    </div>
  )
}
