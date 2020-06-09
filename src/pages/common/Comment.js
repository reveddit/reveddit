import React from 'react'
import { prettyScore, parse, isRemoved } from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import { NOT_REMOVED } from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
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
    const {t, sort} = props.global.state
    let classNames = ['comment', 'user']
    const reddit = 'https://www.reddit.com'
    let submitter = ''
    if (props.is_op) {
      submitter = ' submitter'+' '
    }
    if (props.removed) {
      classNames.push('removed')
    } else if (props.deleted) {
      classNames.push('deleted')
    } else {
      classNames.push('comment-even')
    }
    props.quarantine && classNames.push('quarantine')
    props.locked && classNames.push('locked')

    let directlink = ''
    let after_before = ''
    let add_user = ''
    if (props.prev) {
      after_before = `after=${props.prev}&`
    } else if (props.next) {
      after_before = `before=${props.next}&`
    }
    if (after_before) {
      directlink = '?'+after_before+`limit=1&sort=${props.sort}&show=${props.name}&removal_status=all`
      if (props.removed) {
        add_user = after_before + `add_user=${props.author}&user_time=${t || ''}&user_sort=${sort || ''}&user_kind=${props.kind}&`
      }
    }
    let post_parent_removed = []
    if (props.parent_removed_label) {
      post_parent_removed.push('parent '+props.parent_removed_label)
    }
    if (props.post_removed_label) {
      post_parent_removed.push('thread '+props.post_removed_label)
    }


    const mods_message_body = '\n\n\n'+reddit+props.permalink;
    const mods_link = reddit+'/message/compose?to=/r/'+props.subreddit+'&message='+encodeURI(mods_message_body);

    return (
      <div id={props.name} className={classNames.join(' ')} data-fullname={props.name} data-created_utc={props.created_utc}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className='collapseToggle'>{this.getExpandIcon()}</a>
          <span className='space' />
          <a
            href={props.url ? props.url : props.link_permalink}
            className='title'
          >
          {props.link_title}
          </a>
          {'link_author' in props &&
            <React.Fragment>
              <span> by </span>
              <a
                href={`/user/${props.link_author}`}
                className='author'>
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
          {post_parent_removed.length !== 0 &&
            <span className='removedby'>[{post_parent_removed.join(', ')}]</span>
          }
        </div>
        <div className='comment-head subhead'>
        <Author {...props}/>
        <span className='space' />
        <span className='comment-score'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
        <span className='space' />
        <Time {...props}/>
        {props.locked && <span className='lockedTag'>locked</span>}
        <RemovedBy {...props} />
        </div>
        {
          this.state.displayBody ?
            <div className='comment-body-and-links'>
              <CommentBody {...props}/>
              <div className='comment-links'>
                { ! props.deleted &&
                  <React.Fragment>
                    {props.quarantine && <span className="quarantined">quarantined</span>}
                    { directlink && <a href={directlink}>directlink</a>}
                    { props.parent_context ?
                      <>
                        <a href={props.parent_context+'?removedby=missing'}>reveddit-parent</a>
                        <a href={reddit+props.parent_context}>reddit-parent</a>
                        <a href={reddit+props.permalink+'?context=1'}>reddit-permalink</a>
                      </>
                      :
                        <a href={props.permalink+'?'+add_user+'context=3#'+props.name}>context{props.num_replies && `(${props.num_replies})`}</a>
                    }
                    {props.link_permalink &&
                      <a href={props.link_permalink.replace(/^https:\/\/[^/]*/,'')}>full comments
                        {'num_comments' in props && `(${props.num_comments})`}</a>
                    }
                    { ! props.parent_context &&
                      <a href={mods_link} target="_blank">message mods</a>
                    }
                  </React.Fragment>
                }
              </div>
            </div>
          : ''
        }
      </div>
    )
  }
}

export default connect(Comment)
