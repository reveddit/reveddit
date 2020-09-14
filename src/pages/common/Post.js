import React from 'react'
import { prettyScore, parse, redditThumbnails, replaceAmpGTLT,
         postIsRemovedAndSelftextSaysRemoved, getRemovedMessage,
         PATH_STR_SUB, convertPathSub, stripRedditLikeDomain,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import Author from 'pages/common/Author'
import { NOT_REMOVED } from 'pages/common/RemovedBy'
import { connect } from 'state'
import {MessageMods} from 'components/Misc'
import {www_reddit} from 'api/reddit'

const max_selftext_length = 100

class Post extends React.Component {
  state = {
    displayFullSelftext: true,
    manuallyDisplayedSelftext: false,
    manuallyHiddenSelftext: false,
  }
  displayFullSelftext() {
    this.setState({displayFullSelftext: true, manuallyDisplayedSelftext: true})
  }
  hideFullSelftext() {
    this.setState({displayFullSelftext: false, manuallyHiddenSelftext: true})
  }
  componentDidUpdate() {
    if (! this.state.manuallyDisplayedSelftext && this.props.global.state.initialFocusCommentID && this.state.displayFullSelftext) {
      this.setState({displayFullSelftext: false})
    } else if (! this.state.manuallyHiddenSelftext && ! this.props.global.state.initialFocusCommentID && ! this.state.displayFullSelftext) {
      this.setState({displayFullSelftext: true})
    }
  }
  render() {
    const props = this.props
    if (!props.title) {
      return <div />
    }

    let url = stripRedditLikeDomain(props.url)

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
    let directlink = ''
    if (props.prev) {
      directlink = `?after=${props.prev}&`
    } else if (props.next) {
      directlink = `?before=${props.next}&`
    }
    if (directlink) {
      directlink += `limit=1&sort=${props.sort}&show=${props.name}&removal_status=all`
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
          <a className='thread-title' href={url}>{replaceAmpGTLT(props.title)}</a>
          {
            props.link_flair_text &&
            <span className='link-flair'>{props.link_flair_text}</span>
          }
          <span className='domain'>({domain})</span>
          <div className='thread-info'>
            submitted <Time {...props}/> by <Author {...props}/> to <a className='subreddit-link' href={rev_subreddit+'/'}>/r/{props.subreddit}</a>
            {props.locked && <span className='lockedTag'>locked</span>}
            <div><RemovedBy {...props} /></div>
          </div>
          {selftext &&
            <div className='thread-selftext user-text'>
              {this.state.displayFullSelftext ?
                <>
                  <a className='collapseToggle' onClick={() => this.hideFullSelftext()} style={{float:'left',marginRight:'10px'}}>[–]</a>
                  <div dangerouslySetInnerHTML={{ __html: parse(selftext)}}/>
                </>
              :
                <>
                  <div dangerouslySetInnerHTML={{ __html: parse(selftext_snippet) }}/>
                  {snippet_is_set &&
                    <p>
                      <a className='collapseToggle' onClick={() => this.displayFullSelftext()}>
                        ... view full text
                      </a>
                    </p>
                  }
                </>
              }
            </div>
          }
          <div className='total-comments post-links'>
            {props.quarantine && <span className="quarantined">quarantined</span>}
            <a href={convertPathSub(props.permalink)} className='nowrap'>{props.num_comments} comments</a>
            <a href={www_reddit+props.permalink}>reddit</a>
              <a href={`${rev_subreddit}/duplicates/${props.id}`}>other-discussions{props.num_crossposts ? ` (${props.num_crossposts}+)`:''}</a>
            { directlink && <a href={directlink}>directlink</a>}
            <MessageMods {...props}/>
          </div>
        </div>
        <div className='clearBoth'></div>
      </div>
    )
  }
}
export default connect(Post)
