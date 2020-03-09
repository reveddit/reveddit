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
    att: 'c'
  }
}

const notNeeded = ' This is not necessary if the Real-Time Extension is installed.'
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
    description: 'Allows reveddit.com to work properly when the browser/OS language is not set to english.'+notNeeded
  },
  'q': {
    title: 'Quarantined'+ext_txt,
    description: 'Allows quarantined content to be viewed on reveddit.'+notNeeded
  }
}

const extensionLink = (browser='chrome', extension) => {
  return (
    <a className='white' target="_blank" href={ext_urls[extension][meta[browser].att]}>
      <img alt={`Add to ${browser}`} src={meta[browser].img}/>
    </a>
  )
}

const linkWrap = (extension) => {
  return (
    <>
      <h2 className='about'>{textContent[extension].title}</h2>
      <div style={{paddingBottom:'10px'}}>{textContent[extension].description}</div>
      <div style={{display:'flex', justifyContent:'space-around'}}>
        {extensionLink('chrome', extension)}
        {extensionLink('firefox', extension)}
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
