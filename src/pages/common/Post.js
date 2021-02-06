import React, {useState, useEffect} from 'react'
import { prettyScore, parse, redditThumbnails, replaceAmpGTLT,
         postIsRemovedAndSelftextSaysRemoved, getRemovedMessage,
         PATH_STR_SUB, convertPathSub, stripRedditLikeDomain,
         prettyFormatBigNumber, SimpleURLSearchParams,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy, {QuarantinedLabel} from 'pages/common/RemovedBy'
import Author from 'pages/common/Author'
import { NOT_REMOVED } from 'pages/common/RemovedBy'
import { connect, urlParamKeys } from 'state'
import {MessageMods} from 'components/Misc'
import { NewWindowLink } from 'components/Misc'
import Flair from './Flair'
import SubscribersCount from './SubscribersCount'
import {getAddUserParamString} from './Comment'
import {AuthorFocus} from 'pages/thread/Comment'

const max_selftext_length = 100


const Post = connect((props) => {
  const {global, rev_position, kind, author, name, next, prev, title} = props
  if (! title) {
    return <div/>
  }
  const {sort, t, userCommentsByPost, initialFocusCommentID} = global.state
  let {add_user, loading:globalLoading} = global.state
  const url = stripRedditLikeDomain(props.url)
  const [selftextMeta, setSelftextMeta] = useState({
    displayFullSelftext: true,
    manuallyDisplayedSelftext: false,
    manuallyHiddenSelftext: false,
  })
  const {displayFullSelftext, manuallyDisplayedSelftext, manuallyHiddenSelftext} = selftextMeta
  const [localLoading, setLocalLoading] = useState(false)
  const loading = localLoading || globalLoading
  const showFullSelftext = () => {
    setSelftextMeta({...selftextMeta, displayFullSelftext: true, manuallyDisplayedSelftext: true})
  }
  const hideFullSelftext = () => {
    setSelftextMeta({...selftextMeta, displayFullSelftext: false, manuallyHiddenSelftext: true})
  }
  useEffect(() => {
    if (! manuallyDisplayedSelftext && initialFocusCommentID && displayFullSelftext) {
      setSelftextMeta({...selftextMeta, displayFullSelftext: false})
    } else if (! manuallyHiddenSelftext && ! initialFocusCommentID && ! displayFullSelftext) {
      setSelftextMeta({...selftextMeta, displayFullSelftext: true})
    }
  }, [displayFullSelftext,
      manuallyDisplayedSelftext,
      manuallyHiddenSelftext,
      initialFocusCommentID,
  ])



  let thumbnail
  const thumbnailWidth = props.thumbnail_width ? props.thumbnail_width * 0.5 : 70
  const thumbnailHeight = props.thumbnail_height ? props.thumbnail_height * 0.5 : 70

  if (redditThumbnails.includes(props.thumbnail)) {
    thumbnail = <a href={url} className={`thumbnail thumbnail-${props.thumbnail}`} />
  } else if (props.thumbnail !== '' && props.thumbnail !== 'spoiler') {
    thumbnail = (
      <a href={url}>
        <img className='thumbnail' src={props.thumbnail} width={thumbnailWidth} height={thumbnailHeight} alt='Thumbnail' />
      </a>
    )
  }
  let selftext = props.selftext
  let selftext_snippet = ''
  let snippet_is_set = false
  if (selftext) {
    if (postIsRemovedAndSelftextSaysRemoved(props)) {
      selftext = getRemovedMessage(props, 'submission')
      selftext_snippet = selftext
    } else if (selftext.length > max_selftext_length + 10) {
      snippet_is_set = true
      selftext_snippet = selftext.substring(0,max_selftext_length)+'...'
    } else {
      selftext_snippet = selftext
    }
  }
  let directlink = '', paramString = ''
  if (props.prev) {
    directlink = `?after=${props.prev}&`
  } else if (props.next) {
    directlink = `?before=${props.next}&`
  }
  if (directlink) {
    directlink += `limit=1&sort=${sort}&show=${props.name}&removal_status=all`
    const add_user_param = getAddUserParamString({rev_position, author, userCommentsByPost, link_id: name, kind, sort, t, next, prev})
    if (add_user_param) {
      paramString = '?'+add_user_param
    }
  } else if (add_user) {
    const queryParams = new SimpleURLSearchParams()
    paramString = queryParams.set(urlParamKeys.add_user, add_user).toString()
  }

  let domain = props.domain
  if (! domain.match(/^self\.[^.]+$/)) {
    domain = <a href={`/domain/${props.domain}/`}>{props.domain}</a>
  }
  const rev_subreddit = PATH_STR_SUB+'/'+props.subreddit
  return (
    <div id={props.name} className={`post thread
          ${props.locked ? 'locked':''}
          ${props.stickied ? 'stickied':''}
          ${props.removed ? 'removed':''}
          ${props.unknown ? 'unknown':''}
          ${props.deleted ? 'deleted' : ''}`}
          data-created_utc={props.created_utc} >
      {props.position &&
      <span className='post-rank'>{props.position}</span>}
      <div className='thread-score-box'>
        <div className='vote upvote' />
        <div className='thread-score'>{prettyScore(props.score)}</div>
        <div className='vote downvote' />
      </div>
      {thumbnail}
      <div className='thread-content'>
        <Flair className='link-flair' field='link_flair_text' globalVarName='post_flair' {...props} />
        <a className='thread-title' href={url}>{replaceAmpGTLT(title)}</a>
        <span className='domain'>({domain})</span>
        <div className='thread-info'>
          submitted <Time {...props}/> by <Author {...props}/> to <a className='subreddit-link' href={rev_subreddit+'/'}>/r/{props.subreddit}</a> <SubscribersCount {...props}/>
          <div><RemovedBy {...props} /></div>
        </div>
        <div>
          <span className='total-comments post-links'>
            <QuarantinedLabel {...props}/>
            <a href={convertPathSub(props.permalink)+paramString} className='nowrap'>{props.num_comments} comments</a>
            <NewWindowLink reddit={props.permalink}>reddit</NewWindowLink>
              <a href={`${rev_subreddit}/duplicates/${props.id}`}>other-discussions{props.num_crossposts ? ` (${props.num_crossposts}+)`:''}</a>
            { directlink && <a href={directlink}>directlink</a>}
            <MessageMods {...props}/>
            {props.page_type === 'thread' && <AuthorFocus post={props} author={author} deleted={props.deleted} {...{loading, setLocalLoading}} text='op-focus' addIcon={true}/>}
          </span>
        </div>
      </div>
      <div className='clearBoth' style={{flexBasis:'100%', height: '0'}}></div>
      {selftext &&
        <div className='thread-selftext user-text'>
          <div style={{display: 'table', tableLayout: 'fixed', width: '100%'}}>
            {displayFullSelftext ?
              <>
                {snippet_is_set &&
                  <a className='collapseToggle' onClick={hideFullSelftext} style={{float:'left',marginRight:'10px'}}>[–]</a>
                }
                <div dangerouslySetInnerHTML={{ __html: parse(selftext)}}/>
                {snippet_is_set &&
                  <p><a className='collapseToggle' onClick={hideFullSelftext} style={{float:'left',marginRight:'10px'}}>[–] view less</a></p>
                }
              </>
            :
              <>
                <div dangerouslySetInnerHTML={{ __html: parse(selftext_snippet) }}/>
                {snippet_is_set &&
                  <p>
                    <a className='collapseToggle' onClick={showFullSelftext}>
                      ... view full text
                    </a>
                  </p>
                }
              </>
            }
          </div>
        </div>
      }
    </div>
  )
})

export default Post
