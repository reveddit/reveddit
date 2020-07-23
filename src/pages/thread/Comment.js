import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import { prettyScore, parse, isRemoved, replaceAmpGTLT, jumpToHash, SimpleURLSearchParams } from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import Author from 'pages/common/Author'
import { connect } from 'state'
import { insertParent } from 'data_processing/thread'

const contextDefault = 3
const MIN_COMMENT_DEPTH = 4
const MAX_COMMENT_DEPTH = 9

export const getMaxCommentDepth = () => {
  let depth = Math.round(window.screen.availWidth / 100)
  if (depth < MIN_COMMENT_DEPTH) {
    depth = MIN_COMMENT_DEPTH
  } else if (depth > MAX_COMMENT_DEPTH) {
    depth = MAX_COMMENT_DEPTH
  }
  return depth
}

class Comment extends React.Component {
  state = {
    displayBody: ! this.props.stickied ||
                 this.props.contextAncestors[this.props.id] ||
                 this.props.id == this.props.focusCommentID
  }
  toggleDisplayBody() {
    this.setState({displayBody: ! this.state.displayBody})
  }
  render() {
    let props = this.props
    const {contextAncestors, focusCommentID} = this.props
    const {showContext, limitCommentDepth} = this.props.global.state
    const updateStateAndURL = this.props.global.selection_update
    const context_update = this.props.global.context_update
    const maxCommentDepth = getMaxCommentDepth()
    let even_odd = ''
    if (!props.removed && !props.deleted) {
      even_odd = props.depth % 2 === 0 ? 'comment-even' : 'comment-odd'
    }

    let author = props.author
    if (props.deleted) {
      author = '[deleted]'
    }

    let permalink_nohash = props.permalink ? props.permalink
      : `/r/${props.subreddit}/comments/${props.link_id}/_/${props.id}/`

    const searchParams = new SimpleURLSearchParams(window.location.search).delete('context').delete('showFilters')
    const searchParams_nocontext = searchParams.toString()
    const contextLink = permalink_nohash+searchParams.set('context', contextDefault).toString()+`#${props.name}`
    const permalink = permalink_nohash+searchParams_nocontext+`#${props.name}`
    const getPermalink = (text) => {
      return <Link to={permalink} onClick={(e) => {
        context_update(0, props)
        .then(() => jumpToHash(window.location.hash))
      }}>{text}</Link>
    }
    let parent_link = undefined
    if ('parent_id' in props && props.parent_id.substr(0,2) === 't1') {
      parent_link = permalink_nohash.split('/').slice(0,6).join('/')+'/'+
                    props.parent_id.substr(3)+'/'+searchParams_nocontext+'#'+props.parent_id
    }
    const name = `t1_${props.id}`
    if (Object.keys(contextAncestors).length &&
        props.id != focusCommentID &&
        ! contextAncestors[props.id] &&
        ! props.ancestors[focusCommentID]
        ) {
      return <></>
    }
    let expandIcon = '[+]', hidden = 'hidden'
    if (this.state.displayBody) {
      expandIcon = '[–]'
      hidden = ''
    }
    let replies = ''
    if (showContext && 'replies' in props && props.replies.length > 0) {
      replies = (! limitCommentDepth || props.depth < maxCommentDepth) ?
        props.replies.map(comment => (
          <Comment
            key={comment.id}
            {...comment}
            depth={props.depth + 1}
            global={props.global}
            history={props.history}
            page_type={props.page_type}
            focusCommentID={focusCommentID}
            contextAncestors={contextAncestors}
          />
        ))
        : getPermalink('continue this thread⟶')
    }

    return (
      <div id={name} className={`comment
            ${props.removed ? 'removed':''}
            ${props.deleted ? 'deleted':''}
            ${props.locked ? 'locked':''}
            ${even_odd}
            ${props.id === props.focusCommentID ? 'focus':''}
      `}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className={`collapseToggle spaceRight ${hidden}`}>{expandIcon}</a>
          <Author {...props} className='spaceRight'/>
          <span className='comment-score spaceRight'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
          <Time {...props}/>
          {props.locked && <span className='lockedTag'>locked</span>}
          <RemovedBy {...props} />
        </div>
        {
          this.state.displayBody ?
            <div className='comment-body-and-links'>
              <CommentBody {...props} />
              <div className='comment-links'>
                { ! props.deleted &&
                  <React.Fragment>
                    {getPermalink('permalink')}
                    {parent_link &&
                      // using <a> instead of <Link> for parent & context links b/c
                      // <Link> causes comments to disappear momentarily when inserting a parent
                      <>
                        <a href={parent_link} onClick={(e) => {
                          e.preventDefault()
                          insertParent(props.id, props.global)
                          .then(() => context_update(0, props, parent_link))
                          .then(() => jumpToHash(window.location.hash))
                        }}>parent</a>
                        <a href={contextLink} onClick={(e) => {
                          e.preventDefault()
                          insertParent(props.id, props.global)
                          // parent_id will never be t3_ b/c context link is not rendered for topmost comments
                          .then(() => insertParent(props.parent_id.substr(3), props.global))
                          .then(() => context_update(contextDefault, props, contextLink))
                          .then(() => jumpToHash(window.location.hash))
                        }}>context</a>
                      </>
                    }
                  </React.Fragment>
                }
              </div>
              <div>
                { replies }
              </div>
            </div>

          : ''
        }
      </div>
    )
  }
}

export default withRouter(connect(Comment))
