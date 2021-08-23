import React, {useEffect} from 'react'
import {ext_urls, makeDonateVisible, copyLink} from 'utils'
import { iOS_shortcut_link, InternalPage, abcd} from 'components/Misc'

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

export default () => {
  const textContent = {
    rt: {
      title: rev+'Real-Time',
      description:
        <>
          <p>Notifies you when any of your content on reddit has been removed.</p>
          <p><a href='direct/' onClick={(e) => copyLink(e, true)}>Copy a direct sharelink</a> - copies a link that navigates directly according to the browser.</p>
        </>
    },
    linker: {
      title: rev+'Linker',
      description: <p>One click icon to jump between viewing content on reddit and reveddit.</p>
    },
    q: {
      title: rev+'Quarantined',
      description: <p>Allows quarantined content to be viewed on reveddit.</p>
    },
    rager: {
      title: 'rAger',
      description: <p>Shows the account age and karma for all accounts on reddit pages.</p>
    },
    ios_shortcut: {
      title: 'iOS Shortcut',
      description: iOS_shortcut_link,
      not_an_extension: true,
    },
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

  // Put this inside render b/c iOS_shortcut_link is only defined on render. Not sure why but this only renders once so no big deal
  const linkWrap = (toolCodeName) => {
    const toolMeta = textContent[toolCodeName]
    return (
      <>
        <h2 className='about'>{toolMeta.title}</h2>
        <div style={{margin:'0 5%'}}>
          <div>{toolMeta.description}</div>
          {toolCodeName === 'rt' &&
            (<div style={{margin:'0 0 15px'}}>
              <img src="/images/screenshot-notification-smaller.png" style={{maxWidth:'100%'}}/>
            </div>)
          }
          {! toolMeta.not_an_extension &&
            <div style={{display:'flex', flexWrap:'wrap'}}>
              {extensionLink('chrome', toolCodeName)}
              {extensionLink('firefox', toolCodeName)}
            </div>
          }
          {['q'].includes(toolCodeName) &&
            <p>This is not necessary if the Real-Time Extension is installed.</p>
          }
        </div>
      </>
    )
  }
  useEffect(() => {
    makeDonateVisible()
  }, [])
  return (
    <InternalPage>
      {linkWrap('rt')}
      {linkWrap('linker')}
      {linkWrap('rager')}
      {linkWrap('q')}
      {linkWrap('ios_shortcut')}
    </InternalPage>
  )
}
