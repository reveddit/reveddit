import React from 'react'
import {ext_urls} from 'utils'

const imgur = 'https://i.imgur.com/'
const meta = {
  'chrome': {
    img: imgur+'B0i5sn3.png',
    att: 'c'
  },
  'firefox': {
    img: imgur+'dvof8rG.png',
    att: 'f'
  }
}

const notNeeded = 'This is not necessary if the Real-Time Extension is installed.'
const ext_txt = ' Extension'

const textContent = {
  'rt': {
    title: 'Real-Time'+ext_txt,
    description: 'Notifies you when any of your content on reddit has been removed.'
  },
  'linker': {
    title: 'Linker'+ext_txt,
    description: 'One click icon to jump between viewing content on reddit and reveddit.'
  },
  'language': {
    title: 'Language Fix'+ext_txt,
    description: 'Allows reveddit.com to work properly when the browser/OS language is not set to english.'
  },
  'q': {
    title: 'Quarantined'+ext_txt,
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
        {['q', 'language'].includes(extension) &&
          <p>{notNeeded}</p>
        }
      </div>
    </>
  )
}

export default () => {
  return (
    <div id='main'>
      <div id='main-box'>
        {linkWrap('rt')}
        {linkWrap('linker')}
        {linkWrap('language')}
        {linkWrap('q')}
      </div>
    </div>
  )
}
