import React, {useState} from 'react'
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



// This value has to change for new users to see it
// BETTER: Instead using 'SpreadWord', describe the content shown.
//         That way in the future it will be more clear that I need to use a different value for new content
// NOTE: Var vals for first two uses should remain the same
//         'hasSeenSpreadWord' -> Faithfully Engaged podcast, 1st appearance
//         'hasSeenSpreadWord_v2' -> Demo of YouTube comment shadow removals
const hasSeenFaithfullyEngaged = 'hasSeenSpreadWord'
export const hasSeenSpreadWord = 'hasSeenSpreadWord_v2'

const startTimes = ['1372', '1538', '2073', '3438', '3887', '4319']
const widespread = <p>Shadow banning is more widespread than you think. Spread the word!</p>

// NOTE: id can contain param string
const YoutubeVideo = ({id}) => {
  return <iframe className="video" src={`https://www.youtube-nocookie.com/embed/${id}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
}

export const CoupSaveAmerica = ({topMessage = widespread}) => {
  return (<>
    {topMessage}
    <YoutubeVideo id='2_Fw0NgFZXk'/>
    <div className='space-around' style={{marginBottom: '30px'}}>
      <NewWindowLink href="https://podcasts.apple.com/us/podcast/exploring-shadow-banning-with-robert-hawkins/id1624175133?i=1000653301210">audio only</NewWindowLink>
    </div>
  </>)
}

export const YoutubeShadowRemovals = ({topMessage = widespread}) => {
  return (<>
    {topMessage}
    <YoutubeVideo id='8e6BIkKBZpg'/>
  </>)
}


export const FaithfullyEngaged = ({topMessage = widespread}) => {
  const [startTime] = useState(shuffle(startTimes)[0])
  return (<>
    {topMessage}
    <YoutubeVideo id={`ndiAl6QEA6k?start=${startTime}`}/>
    <div className='space-around' style={{marginBottom: '30px'}}>
      <NewWindowLink href="https://podcasts.apple.com/us/podcast/the-problem-with-shadowbanning-on-reddit-and/id1665487526?i=1000617548040">audio only</NewWindowLink>
    </div>
  </>)
}

export const SpreadWord = FaithfullyEngaged

export const OnlyFoolHumans = () => {
  return (<>
    <NewWindowLink href={media.ofh.news_url} onClick={() => put(media.ofh.local_storage_var, true)}><img alt="Link to article titled: Shadow Bans Only Fool Humans, Not Bots" src="/images/substack-media-2024-01-02.jpg"/></NewWindowLink>
  </>)
}


export const CensorshipWorse = () => {
  return (<>
    <NewWindowLink href={media.cw.news_url} onClick={() => put(media.cw.local_storage_var, true)}><img alt="Link to article titled: A new red army is here: Widespread secret suppression scales thought police to levels not seen since the days of Nazis and Communists, and it is time to speak up about it." src="/images/substack-media-2023-07-21.jpg"/></NewWindowLink>
  </>)
}

export const media = {
  'ofh': {
    'content': OnlyFoolHumans,
    'local_storage_var': 'hasSeenOnlyFoolHumansv2',
    'url_hash': 'only_fool_humans',
    'news_url': 'https://www.removednews.com/p/shadow-bans-only-fool-humans',
    'news_text': "Shadow Bans Only Fool Humans, Not Bots",
  },
  'fe': {
    'content': FaithfullyEngaged,
    'local_storage_var': 'hasSeenSpreadWord',
    'url_hash': 'faithfully_engaged',
    'news_url': 'https://www.youtube.com/watch?v=ndiAl6QEA6k&t=1345s',
    'news_text': "The Problem with Shadowbanning on Reddit and Beyond: A discussion with Reveddit Owner Robert Hawkins",
  },
  'yt': {
    'content': YoutubeShadowRemovals,
    'local_storage_var': 'hasSeenSpreadWord_v2',
    'url_hash': 'youtube_shadow',
  },
  'cw': {
    'content': CensorshipWorse,
    'local_storage_var': 'hasSeenCensorshipWorse',
    'url_hash': 'censorship_worse',
    'news_url': 'https://www.removednews.com/p/hate-online-censorship-its-way-worse',
    'news_text': "Hate Online Censorship? It's Way Worse Than You Think.",
  },
  'csa': {
    'content': CoupSaveAmerica,
    'local_storage_var': 'sawCSA',
    'url_hash': 'csa',
    'news_url': 'https://www.youtube.com/watch?v=2_Fw0NgFZXk',
    'news_text': '',
  },
  // '': {
  //   'content': <></>,
  //   'local_storage_var': '',
  //   'url_hash': '',
  //   'news_url': '',
  //   'news_text': '',
  // },
}

export const headlines = ['ofh']
//export const headlines = Object.keys(media)
const modals = Object.keys(media)

export const newUserModal = (props) => {
  if (window.location.hash === '#say') {
    return
  }
  if (! get('hasNotifierExtension', false) &&
          ! get(hasVisitedSite, false)) {
    props.openGenericModal({hash: 'welcome'})
    put(hasVisitedSite, true)
    return
  }
  for (const key of modals) {
    const media_item = media[key]
    if (! get(media_item.local_storage_var)) {
      props.openGenericModal({hash: media_item.url_hash})
      put(media_item.local_storage_var, true)
      return
    }
  }
}

export const SubredditViewUnavailable = () => {
  return (<>
    <p>Live subreddit view is unavailable. Some historic data may appear here.</p>
    <BlankUserBlurb/>
  </>)
}
