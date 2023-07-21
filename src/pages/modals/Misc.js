import React from 'react'
import { NewWindowLink, SocialLinks } from 'components/Misc'
import BlankUser from 'components/BlankUser'
import Highlight from 'pages/common/Highlight'
import { convertPathSub_reverse, get, put, shuffle } from 'utils'

const BlankUserBlurb = () => (<>
  <p>Look up your account's history:</p>
  <BlankUser message=' '
              placeholder='username'
              bottomMessage={<>
                <Highlight showMobile={true}/>
                <SocialLinks/>
              </>}
  />
</>)

export const Banned = () => {
  const redditPath = convertPathSub_reverse(window.location.pathname).split('/').slice(0,3).join('/')
  return (
    <>
      <h3>Historical view</h3>
      <p><NewWindowLink reddit={redditPath}>{redditPath}</NewWindowLink> is either private, banned, or does not exist. This historical view may show some of the top removed content.</p>
      <BlankUserBlurb/>
    </>
  )
}

const hasVisitedSite = 'hasVisitedSite'
export const hasSeenSpreadWord = 'hasSeenSpreadWord'
const startTimes = ['1372', '1538', '2073', '3438', '3886', '4319']
const widespread = <p>Shadowbanning is more widespread than you think. Spread the word!</p>
export const SpreadWord = ({topMessage = widespread}) => {
  return (<>
    {topMessage}
    <iframe className="video" src={`https://www.youtube-nocookie.com/embed/8e6BIkKBZpg`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
  </>)
}

export const SpreadWordPrev = ({topMessage = widespread}) => {
  return (<>
    {topMessage}
    <iframe className="video" src={`https://www.youtube-nocookie.com/embed/ndiAl6QEA6k?start=${shuffle(startTimes)[0]}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
    <div className='space-around' style={{marginBottom: '30px'}}>
      <NewWindowLink href="https://podcasts.apple.com/us/podcast/the-problem-with-shadowbanning-on-reddit-and/id1665487526?i=1000617548040">audio only</NewWindowLink>
      <NewWindowLink href="https://faithfullyengaged.com/blog/the-changing-landscape-of-social-media-from-community-to-censorship">write-up</NewWindowLink>
    </div>
  </>)
}

const hasSeenCensorshipWorse = 'hasSeenCensorshipWorse'
export const censorshipWorseLink = 'https://www.removednews.com/p/hate-online-censorship-its-way-worse'
export const CensorshipWorse = () => {
  return (<>
    <NewWindowLink href={censorshipWorseLink} onClick={() => put(hasSeenCensorshipWorse, true)}><img alt="Link to article titled: A new red army is here: Widespread secret suppression scales thought police to levels not seen since the days of Nazis and Communists, and it is time to speak up about it." src="/images/substack-media-2023-07-21.jpg"/></NewWindowLink>
  </>)
}
//hash -> localStorageKey
const showOneOfTheseFirst = {
  'censorship_worse': hasSeenCensorshipWorse,
  'spread_word': hasSeenSpreadWord,
}

export const newUserModal = (props) => {
  const hash_options = []
  for (const [hash, localStorageKey] of Object.entries(showOneOfTheseFirst)) {
    if (! get(localStorageKey, false)) {
      hash_options.push(hash)
    }
  }
  if (hash_options.length) {
    const hash = shuffle(hash_options)[0]
    props.openGenericModal({hash})
  } else if (! get('hasNotifierExtension', false) &&
          ! get(hasVisitedSite, false)) {
    props.openGenericModal({hash: 'welcome'})
    put(hasVisitedSite, true)
  }
}

export const SubredditViewUnavailable = () => {
  return (<>
    <p>Live subreddit view is unavailable. Some historic data may appear here.</p>
    <BlankUserBlurb/>
  </>)
}
