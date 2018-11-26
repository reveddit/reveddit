import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { prettyScore, parse, redditThumbnails, isDeleted } from '../../utils'
import Time from '../common/Time'
import RemovedBy from '../common/RemovedBy'
import { NOT_REMOVED } from '../common/RemovedBy'

class Post extends React.Component {
  render() {
    const props = this.props
    if (!props.title) {
      return <div />
    }
    const queryParams = new URLSearchParams(this.props.location.search)
    const current_page = `${this.props.location.pathname}?${queryParams.toString()}`
    const reddit = 'https://www.reddit.com'
    const mods_message_body = '\n\n\n'+reddit+props.permalink;
    const mods_link = reddit+'/message/compose?to='+props.subreddit+'&message='+encodeURI(mods_message_body);
    let message_mods = ''
    if (props.removed || props.removedby && props.removedby !== NOT_REMOVED) {
      message_mods = <a href={mods_link} target="_blank">message mods</a>
    }
    let url = props.url.replace('https://www.reddit.com', '')

    const userLink = isDeleted(props.author) ? undefined : `/user/${props.author}`

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

    return (
      <div id={props.name} className={`post thread ${props.removed ? 'removed':''} ${props.unknown ? 'unknown':''} ${props.deleted ? 'deleted' : ''}`}>
        {props.position &&
        <span className='post-rank'>{props.position}</span>}
        <div className='thread-score-box'>
          <div className='vote upvote' />
          <div className='thread-score'>{prettyScore(props.score)}</div>
          <div className='vote downvote' />
        </div>
        {thumbnail}
        <div className='thread-content'>
          <a className='thread-title' href={url}>{props.title}</a>
          {
            props.link_flair_text &&
            <span className='link-flair'>{props.link_flair_text}</span>
          }
          <span className='domain'>({props.domain})</span>
          <div className='thread-info'>
            submitted <Time created_utc={props.created_utc}/> by&nbsp;
            <a className='thread-author author' href={userLink}>{props.author}</a>
            &nbsp;to <Link className='subreddit-link author' to={`/r/${props.subreddit}`}>/r/{props.subreddit}</Link>
            &nbsp;<RemovedBy removedby={props.removedby} />
          </div>
          {props.selftext &&
          <div className='thread-selftext user-text' dangerouslySetInnerHTML={{ __html: parse(props.selftext) }} />}
          <div className='total-comments post-links'>
            <Link to={props.permalink}>{props.num_comments} comments</Link>
            <a href={`${current_page}#${props.name}`}>hashlink</a>
            <a href={`https://www.reddit.com${props.permalink}`}>reddit</a>
            {message_mods}
          </div>
        </div>
      </div>
    )
  }
}
export default withRouter(Post)
