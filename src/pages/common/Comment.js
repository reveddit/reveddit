import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import { prettyScore, parse, isRemoved } from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import { NOT_REMOVED } from 'pages/common/RemovedBy'
import { connect } from 'state'

class Comment extends React.Component {
  state = {
    displayBody: true
  }
  toggleDisplayBody() {
    this.setState({displayBody: ! this.state.displayBody})
  }
  getExpandIcon() {
    if (this.state.displayBody) {
      return '[–]'
    } else {
      return '[+]'
    }
  }

  render() {
    const props = this.props
    let commentStyle = 'comment user '
    const reddit = 'https://www.reddit.com'
    let submitter = ''
    if (props.author === props.link_author) {
      submitter = ' submitter '
    }
    if (props.removed) {
      commentStyle += 'removed '
    } else if (props.deleted) {
      commentStyle += 'deleted '
    } else {
      commentStyle += 'comment-even '
    }

    let innerHTML = ''
    let author = props.author
    if (! props.deleted) {
        innerHTML = (isRemoved(props.body) && props.removed) ?
          '<p>[removed too quickly to be archived]</p>' :
          parse(props.body.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<'))
    } else {
      author = '[deleted]'
    }

    let link = '?'
    if (props.prev) {
      link = `?after=${props.prev}&`
    } else if (props.next) {
      link = `?before=${props.next}&`
    }
    link += `limit=1&sort=${props.sort}&show=${props.name}`

    const mods_message_body = '\n\n\n'+reddit+props.permalink;
    const mods_link = reddit+'/message/compose?to='+props.subreddit+'&message='+encodeURI(mods_message_body);
    const queryParams = new URLSearchParams(this.props.location.search)
    const current_page = `${this.props.location.pathname}?${queryParams.toString()}`
    let message_mods = ''
    if (props.removed || props.removedby && props.removedby !== NOT_REMOVED) {
      message_mods = <a href={mods_link} target="_blank">message mods</a>
    }
    return (
      <div id={props.name} className={commentStyle}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className='collapseToggle'>{this.getExpandIcon()}</a>
          <span className='space' />
          <a
            href={props.link_permalink}
            className='title'
          >
          {props.link_title}
          </a>
          {'link_author' in props &&
            <React.Fragment>
              <span> by </span>
              <a
                href={`/user/${props.link_author}`}
                className='author comment-author'>
                {props.link_author}
              </a>
            </React.Fragment>
          }
          {'subreddit' in props &&
            <React.Fragment>
              <span> in </span>
              <a
                href={`/r/${props.subreddit}`}
                className='subreddit-link subreddit'
                data-subreddit={props.subreddit}
              >
                {`/r/${props.subreddit}`}
              </a>
            </React.Fragment>
          }
        </div>
        <div className='comment-head subhead'>
        <a
          href={`/user/${author}`}
          className={`author comment-author ${submitter}`}
        >
          {author}
          {props.deleted && ' (by user)'}
        </a>
        <span className='space' />
        <span className='comment-score'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
        <span className='space' />
        <Time created_utc={props.created_utc}/> <RemovedBy removedby={props.removedby} />
        </div>
        {
          this.state.displayBody ?
            <div className='comment-body-and-links'>
              <div className='comment-body' dangerouslySetInnerHTML={{ __html: innerHTML }} />
              <div className='comment-links'>
                <a href={link}>directlink</a>
                <a href={`${current_page}#${props.name}`}>hashlink</a>
                <a href={props.permalink}>permalink</a>
                <a href={reddit+props.permalink+'?context=3'}>context</a>
                <a href={props.link_permalink && props.link_permalink.replace('reddit','revddit')}>full comments
                  {'num_comments' in props && `(${props.num_comments})`}</a>
                {message_mods}
              </div>
            </div>
          : ''
        }
      </div>
    )
  }
}

export default withRouter(connect(Comment))
