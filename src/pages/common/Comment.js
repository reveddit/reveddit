import React from 'react'
import { prettyScore, parse,
         PATH_STR_USER, PATH_STR_SUB, convertPathSub, stripRedditLikeDomain,
} from 'utils'
import Time from 'pages/common/Time'
import RemovedBy, {QuarantinedLabel} from 'pages/common/RemovedBy'
import { NOT_REMOVED, ORPHANED } from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect, hasClickedRemovedUserCommentContext } from 'state'
import {AddUserParam} from 'data_processing/FindCommentViaAuthors'
import {MessageMods} from 'components/Misc'
import {www_reddit, old_reddit} from 'api/reddit'
import Flair from './Flair'
import SubscribersCount from './SubscribersCount'

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
    let after_before = '', after = '', before = ''
    let add_user = ''
    if (props.prev) {
      after_before = `after=${props.prev}&`
      after = props.prev
    } else if (props.next) {
      after_before = `before=${props.next}&`
      before = props.next
    }
    if (after_before) {
      directlink = '?'+after_before+`limit=1&sort=${props.sort}&show=${props.name}&removal_status=all`
      if (props.removed) {
        const addUserParam = new AddUserParam()
        addUserParam.addItems({
          author: props.author,
          ...(props.kind && {kind: props.kind}),
          ...(sort && {sort: sort}),
          ...(t && {time: t}),
          before, after, limit: 1,
        })
        add_user = addUserParam.toString()
      }
    }
    let post_parent_removed = []
    if (props.parent_removed_label) {
      post_parent_removed.push('parent '+props.parent_removed_label)
    }
    if (props.post_removed_label) {
      post_parent_removed.push('link '+props.post_removed_label)
    }
    const rev_subreddit = PATH_STR_SUB+'/'+props.subreddit
    const rev_link_permalink = props.link_permalink ?
      convertPathSub(props.link_permalink.replace(/^https:\/\/[^/]*/,''))
      : ''
    return (
      <div id={props.name} className={classNames.join(' ')} data-fullname={props.name} data-created_utc={props.created_utc}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className='collapseToggle spaceRight'>{this.getExpandIcon()}</a>
          <Flair className='link-flair' field='link_flair_text' globalVarName='post_flair' {...props} />
          <a href={props.url ? stripRedditLikeDomain(props.url) : rev_link_permalink} className='title'
            >{props.link_title}</a>
          {'link_author' in props &&
            <React.Fragment>
              <span> by </span>
              <a
                href={`${PATH_STR_USER}/${props.link_author}`}
                className='author'>
                {props.link_author}
              </a>
            </React.Fragment>
          }
          {'subreddit' in props &&
            <React.Fragment>
              <span> in </span>
              <a
                href={rev_subreddit+'/'}
                className='subreddit-link subreddit'
                data-subreddit={props.subreddit}
              >
                {`/r/${props.subreddit}`}
              </a> <SubscribersCount {...props}/>
            </React.Fragment>
          }
        </div>
        <div className='comment-head subhead'>
          <Author {...props} className='spaceRight'/>
          <span className='comment-score spaceRight'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
          <Time {...props}/>
          <div>
            <RemovedBy style={{display:'inline', marginRight: '5px'}} {...props} />
            {post_parent_removed.length !== 0 &&
              <RemovedBy removedby={ORPHANED} orphaned_label={post_parent_removed.join(', ')} style={{display:'inline'}}/>
            }
          </div>
        </div>
        <div className='comment-body-and-links' style={this.state.displayBody ? {} : {display: 'none'}}>
          <CommentBody {...props}/>
          <div className='comment-links'>
            { ! props.deleted &&
              <>
                <QuarantinedLabel {...props}/>
                { props.parent_context ?
                  <>
                    <a href={props.parent_context+'?removedby=missing'}>reveddit-parent</a>
                    <a href={www_reddit+props.parent_context}>reddit-parent</a>
                    <a href={www_reddit+props.permalink+'?context=1'}>reddit-permalink</a>
                  </>
                  :
                    <a href={props.permalink+'?context=3&'+add_user+'#'+props.name}
                       onClick={add_user ? hasClickedRemovedUserCommentContext: null}
                    >context{props.num_replies && `(${props.num_replies})`}</a>
                }
                {rev_link_permalink &&
                  <a href={rev_link_permalink+'?'+add_user}>full comments
                    {'num_comments' in props && `(${props.num_comments})`}</a>
                }
                <a href={old_reddit+props.permalink+'?context=3'}>reddit</a>
                { directlink && <a href={directlink}>directlink</a>}
                { ! props.parent_context &&
                  <MessageMods {...props}/>
                }
              </>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default connect(Comment)
