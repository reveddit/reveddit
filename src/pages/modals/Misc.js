import React from 'react'
import { NewWindowLink, SocialLinks } from 'components/Misc'
import BlankUser from 'components/BlankUser'
import Highlight from 'pages/common/Highlight'
import { convertPathSub_reverse, get, put } from 'utils'

export const Banned = () => {
  const redditPath = convertPathSub_reverse(window.location.pathname).split('/').slice(0,3).join('/')
  return (
    <>
      <h3>Historical view</h3>
      <p><NewWindowLink reddit={redditPath}>{redditPath}</NewWindowLink> is either private, banned, or does not exist. This historical view may show some of the top removed content.</p>
      <p>Look up your account's history:</p>
      <BlankUser message=' '
                  placeholder='username'
                  bottomMessage={<>
                    <Highlight showMobile={true}/>
                    <SocialLinks/>
      </>}/>
    </>
  )
}

const hasVisitedSite = 'hasVisitedSite'
export const hasSeenSpreadWord = 'hasSeenSpreadWord'

export const SpreadWord = () => {
  return (<>
    <p>Shadowbanning is more widespread than you think. Spread the word!</p>
    <iframe className="video" src="https://www.youtube-nocookie.com/embed/ndiAl6QEA6k?start=1345" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    <div className='space-around' style={{marginBottom: '30px'}}>
      <NewWindowLink href="https://podcasts.apple.com/us/podcast/the-problem-with-shadowbanning-on-reddit-and/id1665487526?i=1000617548040">audio only</NewWindowLink>
      <NewWindowLink href="https://faithfullyengaged.com/blog/the-changing-landscape-of-social-media-from-community-to-censorship">write-up</NewWindowLink>
    </div>
    <SocialLinks/>
  </>)
}

export const newUserModal = (props) => {
  if (! get(hasSeenSpreadWord, false)) {
    props.openGenericModal({hash: 'spread_word'})
  } else if (! get('hasNotifierExtension', false) &&
          ! get(hasVisitedSite, false)) {
    props.openGenericModal({hash: 'welcome'})
    put(hasVisitedSite, true)
  }
}
