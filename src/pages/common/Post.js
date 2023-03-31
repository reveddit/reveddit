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
import {get_userPageSortAndTime} from 'data_processing/RestoreComment'

const max_selftext_length = 100

const decodeHtml = (html) => {
    var txt = document.createElement("textarea")
    txt.innerHTML = html
    return txt.value || html
}
const clear = <div className='clearBoth' style={{flexBasis:'100%', height: '0'}}></div>

const Post = connect((props) => {
  const {
    global, rev_position, page_type,
    kind, author, name, next, prev, title,
  } = props
  if (! title) {
    return <div/>
  }
  const {media_metadata} = props.over_18 ? {} : props
  const {sort, t, userCommentsByPost, initialFocusCommentID, limitCommentDepth} = global.state
  let {add_user, loading:globalLoading} = global.state
  const url = stripRedditLikeDomain(props.url.replace(/&amp;/g, '&'))
  const [selftextMeta, setSelftextMeta] = useState({
    displayFullSelftext: true,
    manuallyDisplayedSelftext: false,
    manuallyHiddenSelftext: false,
  })
  const [focusedMediaKey, setFocusedMediaKey] = useState(null)
  const focusedImageList = getImageList({media_metadata, id: focusedMediaKey})
  const {displayFullSelftext, manuallyDisplayedSelftext, manuallyHiddenSelftext} = selftextMeta
  const [localLoading, setLocalLoading] = useState(false)
  const loading = localLoading || globalLoading
  const {userPageSort, userPageTime} = get_userPageSortAndTime(props)
  const showFullSelftext = () => {
    setSelftextMeta({...selftextMeta, displayFullSelftext: true, manuallyDisplayedSelftext: true})
  }
  const hideFullSelftext = () => {
    setSelftextMeta({...selftextMeta, displayFullSelftext: false, manuallyHiddenSelftext: true})
  }
  useEffect(() => {
    if (limitCommentDepth && ! manuallyDisplayedSelftext && initialFocusCommentID && displayFullSelftext) {
      setSelftextMeta({...selftextMeta, displayFullSelftext: false})
    } else if (! limitCommentDepth && ! manuallyHiddenSelftext && ! initialFocusCommentID && ! displayFullSelftext) {
      setSelftextMeta({...selftextMeta, displayFullSelftext: true})
    }
  }, [displayFullSelftext,
      manuallyDisplayedSelftext,
      manuallyHiddenSelftext,
      initialFocusCommentID,
      limitCommentDepth,
  ])
  // display the full post if comment depth isn't limited, even on pages that are a direct link to a comment
  // provides a way to link a comment and see the text of the post
  useEffect(() => {
    let display = true
    if (limitCommentDepth && initialFocusCommentID) {
      display = false
    }
    setSelftextMeta({...selftextMeta, displayFullSelftext: display})
  }, [limitCommentDepth])

  let thumbnail
  const thumbnailWidth = props.thumbnail_width ? props.thumbnail_width * 0.5 : 70
  const thumbnailHeight = props.thumbnail_height ? props.thumbnail_height * 0.5 : 70

  if (redditThumbnails.includes(props.thumbnail)) {
    thumbnail = <a href={url} className={`thumbnail thumbnail-${props.thumbnail}`} />
  } else if (props.thumbnail && props.thumbnail !== 'spoiler') {
    thumbnail = (
      <a href={url}>
        <img className='thumbnail' src={props.thumbnail} width={thumbnailWidth} height={thumbnailHeight} alt='Thumbnail' />
      </a>
    )
  }
  let selftext = decodeHtml(props.selftext)
  let selftext_snippet = '', removedMessage = <></>
  let snippet_is_set = false
  if (selftext) {
    if (postIsRemovedAndSelftextSaysRemoved(props)) {
      selftext = ' ' // set to space so that it evaluates to true
      removedMessage = getRemovedMessage(props, 'submission')
    } else if (selftext.length > max_selftext_length + 10) {
      snippet_is_set = true
      selftext_snippet = selftext.substring(0,max_selftext_length)+'...'
    } else {
      selftext_snippet = selftext
    }
  }
  let directlink = '', paramString = ''
  if (! props.stickied) {
    if (props.prev) {
      directlink = `?after=${props.prev}&`
    } else if (props.next) {
      directlink = `?before=${props.next}&`
    }
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
  let domain_link = ''
  if (! domain.match(/^self\.[^.]+$/)) {
    domain_link = `/domain/${props.domain}/`
    domain = <a href={domain_link}>{props.domain}</a>
  }
  const rev_subreddit = PATH_STR_SUB+'/'+props.subreddit
  let subreddit_index = '', domain_index = ''
  if (page_type !== 'subreddit_posts' && page_type !== 'domain_posts') {
    const index_queryParams = `?removal_status=all&before=${props.created_utc+1}#t3_${props.id}`
    subreddit_index = <a href={rev_subreddit+'/'+index_queryParams}>subreddit-index</a>
    if (domain_link) {
      domain_index = <a href={domain_link+index_queryParams}>domain-index</a>
    }
  }
  const classes = ['post', 'thread']
  for (const c of ['locked', 'stickied', 'removed', 'unknown', 'deleted', 'pinned']) {
    if (props[c]) {
      classes.push(c)
    }
  }

  return (
    <div id={props.name} className={classes.join(' ')}
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
            {subreddit_index}
            { directlink && <a href={directlink}>directlink</a>}
            <MessageMods {...props}/>
            {page_type === 'thread' && <AuthorFocus post={props} author={author} deleted={props.deleted}
                                                    {...{loading, setLocalLoading, userPageSort, userPageTime}}
                                                    text='op-focus' addIcon={true}/>}
            {domain_index}
          </span>
        </div>
      </div>
      {clear}
      {page_type === 'thread' && media_metadata && ! props.deleted &&
        <div className='thread-media'>
          { focusedImageList?.length ?
            <BestImage list={focusedImageList} onClick={() => setFocusedMediaKey(null)} />
            : Object.entries(media_metadata).map(([key, meta]) => {
              if (meta.e !== 'Image' || ! meta.p.length) {
                return null
              }
              const preview = meta.p[0]
              return <Image key={key} {...preview}
                            onClick={() => setFocusedMediaKey(key) } />
            })
          }
        </div>
      }
      {clear}
      {selftext &&
        <div className='thread-selftext'>
          <div style={{display: 'table', tableLayout: 'fixed', width: '100%'}}>
            {displayFullSelftext ?
              <>
                {snippet_is_set &&
                  <a className='collapseToggle' onClick={hideFullSelftext} style={{float:'left',marginRight:'10px'}}>[–]</a>
                }
                <Selftext {...{selftext, media_metadata}}/>
                {removedMessage}
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

const redditPreview_regexpString_base = 'https://preview\\.redd\\.it/'
const redditPreview_regexpString_withParen = redditPreview_regexpString_base+'[^\\s]+'
const redditPreview_regexpString_noParen = redditPreview_regexpString_base+'([^.]+)\\.[^)\\s]+'
const splitOnPreview_regexp = new RegExp('((?:\\[[^\\]]*\\]\\()?'+redditPreview_regexpString_withParen+')')
const maxWidthInsideSelftextBox = 835
const calculateMaxImageSizeForScreen = () => window.innerWidth - 40
const Selftext = ({selftext, media_metadata}) => {
  if (media_metadata) {
    return <SelftextInParts {...{selftext, media_metadata}} />
  } else {
    return <SelftextPart selftext={selftext} />
  }
}

const SelftextPart = ({selftext}) => <div dangerouslySetInnerHTML={{__html: parse(selftext)}}/>

const SelftextInParts = ({selftext, media_metadata}) => {
  const selftextParts = selftext.split(splitOnPreview_regexp)
  const result = []
  const maxImageSizeForScreen = calculateMaxImageSizeForScreen()
  const maxWidth = Math.min(maxImageSizeForScreen, maxWidthInsideSelftextBox)
  for (const [i, part] of selftextParts.entries()) {
    const match = part.match(new RegExp('(?:\\[([^\\]]*)\\]\\()?('+redditPreview_regexpString_noParen+')'))
    if (match) {
      const [ , caption, url, id] = match
      const list = getImageList({media_metadata, id})
      if (list) {
        const marginTop = caption ? '' : '5px'
        result.push(
          <div key={i} style={{textAlign:'center', marginTop}}>
            {caption && <h4>{caption}</h4>}
            <BestImage key={i} list={list} maxWidth={maxWidth}/>
          </div>
        )
      }
      continue
    }
    result.push(<SelftextPart key={i} selftext={part}/>)
  }
  return result
}


const getImageList = ({media_metadata, id}) => {
  if (media_metadata && id) {
    const imageData = media_metadata[id]
    if (imageData) {
      const list = imageData.p
      if (list && imageData.s) {
        list.push(imageData.s)
      }
      return list
    }
  }
  return undefined
}

const Image = ({x, y, u, onClick}) => {
  return <img className={onClick ? 'pointer' : ''} width={x} height={y} src={replaceAmpGTLT(u)} onClick={onClick} />
}

const BestImage = ({list, onClick, maxWidth = calculateMaxImageSizeForScreen()}) => {
  for (const preview of list.slice().reverse()) {
    if (preview.x < maxWidth) {
      return <Image {...preview} onClick={onClick} />
    }
  }
  return <Image {...list[0]} onClick={onClick} />
}

export default Post
