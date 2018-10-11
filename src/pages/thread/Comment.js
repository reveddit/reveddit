import React from 'react'
import { Link } from 'react-router-dom'
import { prettyScore, parse, isRemoved } from '../../utils'
import Time from '../common/Time'
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
    const props = this.props
    let commentStyle = 'comment '

    if (props.removed) {
      commentStyle += 'removed'
    } else if (props.deleted) {
      commentStyle += 'deleted'
    } else {
      commentStyle += props.depth % 2 === 0 ? 'comment-even' : 'comment-odd'
    }

    const innerHTML = (isRemoved(props.body) && props.removed) ? '<p>[removed too quickly to be archived]</p>' : parse(props.body)
    const permalink = `/r/${props.subreddit}/comments/${props.link_id}/_/${props.id}/`
    const name = `t1_${props.id}`

    return (
      <div id={name} className={commentStyle}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className='collapse title'>{this.getExpandIcon()}</a>
          <span className='space' />
          <a
            href={props.author !== '[deleted]' ? `/user/${props.author}` : undefined}
            className='author comment-author'
          >
            {props.author}
            {props.deleted && ' (deleted by user)'}
          </a>
          <span className='space' />
          <span className='comment-score'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
          <span className='space' />
          <Time created_utc={props.created_utc}/>
        </div>
        {
          this.state.displayBody ?
            <div className='comment-body-and-links'>
              <div className='comment-body' dangerouslySetInnerHTML={{ __html: innerHTML }} />
              <div className='comment-links'>
                <a href={`${permalink}#${name}`}>hashlink</a>
                <Link to={permalink}>permalink</Link>
                <a href={`https://www.reddit.com${permalink}`}>reddit</a>
                <a href={`https://snew.github.io${permalink}`}>ceddit</a>
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
