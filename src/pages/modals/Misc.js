import React, {useState} from 'react'
import { NewWindowLink, SocialLinks } from 'components/Misc'
import BlankUser from 'components/BlankUser'
import Highlight from 'pages/common/Highlight'
import { convertPathSub_reverse, get, put, shuffle } from 'utils'
import YouTube from 'react-youtube'

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
const startTimes = {1372: 'Over 50%', 1538: 'Origins', 2074: 'Bots', 3438: 'YouTube', 3886: 'Truth', 4319: 'Anxiety'}
const videoId = 'ndiAl6QEA6k'
export const SpreadWord = ({topMessage = <p>Shadowbanning is more widespread than you think. Spread the word!</p>}) => {
  const [player, setPlayer] = useState()
  const [currentStart, setCurrentStart] = useState(shuffle(Object.keys(startTimes))[0])
  const timestamps = Object.entries(startTimes).map(([start, text]) => {
    let style = {}
    let playText=''
    if (start === currentStart) {
      style.fontWeight='bold'
      playText='⏵ '
    }
    return <a href={'https://youtu.be/'+videoId+'?t='+start.toString()+'s'} onClick={(e) => {
      e.preventDefault()
      setCurrentStart(start)
      setTimeout(() =>
        player?.seekTo(start, true),
        200) // I forgot the right way to do this
    }} style={style}>{playText+text}</a>
  })
  return (<>
    {topMessage}
    <YouTube videoId={videoId}
      opts={{
        width:'',height:'',
        playerVars: {start: currentStart},
      }}
      iframeClassName='video'
      onReady={(event) => setPlayer(event.target)}/>
    <div style={{textAlign:'center', marginBottom:'3px'}}>Timestamps</div>
    <div className='space-around' style={{marginBottom: '30px'}}>
      {timestamps}
    </div>
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

export const SubredditViewUnavailable = () => {
  return (<>
    <p>Live subreddit view is unavailable. Some historic data may appear here.</p>
    <BlankUserBlurb/>
  </>)
}
