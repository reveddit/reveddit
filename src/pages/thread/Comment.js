import React from 'react'
import { Link } from 'react-router-dom'
import { prettyScore, parse, isRemoved } from '../../utils'
import Time from '../common/Time'
import RemovedBy from '../common/RemovedBy'
import { connect } from '../../state'


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
    let props = this.props
    let commentStyle = 'comment '

    if (props.removed) {
      commentStyle += 'removed'
    } else if (props.deleted) {
      commentStyle += 'deleted'
    } else {
      commentStyle += props.depth % 2 === 0 ? 'comment-even' : 'comment-odd'
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

    let permalink = `/r/${props.subreddit}/comments/${props.link_id}/_/${props.id}/`
    if (props.permalink) {
      permalink = props.permalink
    }
    const name = `t1_${props.id}`
    let submitter = ''
    if (! props.deleted && author !== '[deleted]' && author === props.link_author) {
      submitter = ' submitter '
    }
    return (
      <div id={name} className={commentStyle}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className='collapseToggle'>{this.getExpandIcon()}</a>
          <span className='space' />
          <a
            href={author !== '[deleted]' ? `/user/${author}` : undefined}
            className={`author comment-author ${submitter}`}
          >
            {author}
            {props.deleted && ' (by user)'}
          </a>
          <span className='space' />
          {author !== '[deleted]' && props.author_flair_text ?
            <span className='flair'>{props.author_flair_text}</span>
          : ''}
          <span className='space' />
          <span className='comment-score'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
          <span className='space' />
          <Time created_utc={props.created_utc}/>  <RemovedBy removedby={props.removedby} />
        </div>
        {
          this.state.displayBody ?
            <div className='comment-body-and-links'>
              <div className='comment-body' dangerouslySetInnerHTML={{ __html: innerHTML }} />
              <div className='comment-links'>
                <a href={`${permalink}#${name}`}>hashlink</a>
                <Link to={permalink}>permalink</Link>
                <a href={`https://www.reddit.com${permalink}`}>reddit</a>
              </div>
              <div>
                {props.replies.map(comment => (
                  <Comment
                    key={comment.id}
                    {...comment}
                    depth={props.depth + 1}
                  />
                ))}
              </div>
            </div>

          : ''
        }
      </div>
    )
  }
}

export default connect(Comment)
