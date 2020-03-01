import React from 'react'
import { Link } from 'react-router-dom'
import { prettyScore, parse, isRemoved, replaceAmpGTLT, jumpToHash, SimpleURLSearchParams } from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import CommentBody from 'pages/common/CommentBody'
import { connect } from 'state'
import { insertParent } from 'data_processing/thread'

const contextDefault = 3

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
    const showContext = this.props.global.state.showContext
    const updateStateAndURL = this.props.global.selection_update
    const context_update = this.props.global.context_update

    let even_odd = ''
    if (!props.removed && !props.deleted) {
      even_odd = props.depth % 2 === 0 ? 'comment-even' : 'comment-odd'
    }

    let author = props.author
    if (props.deleted) {
      author = '[deleted]'
    }

    let permalink_nohash = `/r/${props.subreddit}/comments/${props.link_id}/_/${props.id}/`
    if (props.permalink) {
      permalink_nohash = props.permalink
    }
    const search_nocontext = new SimpleURLSearchParams(window.location.search).delete('context').toString()
    permalink_nohash += search_nocontext
    let connectingChar = '?'
    const contextParam = `context=${contextDefault}#${props.name}`
    if (search_nocontext) {
      connectingChar = '&'
    }
    const contextLink = permalink_nohash+connectingChar+contextParam
    const permalink = permalink_nohash+`#${props.name}`
    let parent_link = undefined
    if ('parent_id' in props && props.parent_id.substr(0,2) === 't1') {
      parent_link = permalink_nohash.split('/').slice(0,6).join('/')+'/'+props.parent_id.substr(3)+'/'+search_nocontext+'#'+props.parent_id
    }
    const name = `t1_${props.id}`
    let submitter = ''
    if (! props.deleted && author !== '[deleted]' && props.is_op) {
      submitter = ' submitter '
    }
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
    return (
      <div id={name} className={`comment
            ${props.removed ? 'removed':''}
            ${props.deleted ? 'deleted':''}
            ${props.locked ? 'locked':''}
            ${even_odd}
            ${props.id === props.focusCommentID ? 'focus':''}
      `}>
        <div className='comment-head'>
          <a onClick={() => this.toggleDisplayBody()} className={`collapseToggle ${hidden}`}>{expandIcon}</a>
          <span className='space' />
          <a
            href={author !== '[deleted]' ? `/user/${author}` : undefined}
            className={`author ${submitter}
                      ${props.distinguished ? 'distinguished '+props.distinguished : ''}
            `}
          >
            {author}
            {props.deleted && ' (by user)'}
          </a>
          <span className='space' />
          {author !== '[deleted]' && props.author_flair_text ?
            <span className='flair'>{replaceAmpGTLT(props.author_flair_text)}</span>
          : ''}
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
              <CommentBody {...props} />
              <div className='comment-links'>
                { ! props.deleted &&
                  <React.Fragment>
                    <Link to={permalink} onClick={(e) => {
                      context_update(0, props)
                      .then(jumpToHash(window.location.hash))
                    }}>permalink</Link>
                    {parent_link &&
                      <>
                        <Link to={parent_link} onClick={(e) => {
                          context_update(0, props)
                          .then(() => insertParent(props.id, props.global))
                          .then(() => jumpToHash(window.location.hash))
                        }}>parent</Link>
                        <Link to={contextLink} onClick={(e) => {
                          context_update(contextDefault, props)
                          .then(() => insertParent(props.id, props.global))
                          // parent_id will never be t3_ b/c context link is not rendered for topmost comments
                          .then(() => insertParent(props.parent_id.substr(3), props.global))
                          .then(() => jumpToHash(window.location.hash))
                        }}>context</Link>
                      </>
                    }
                  </React.Fragment>
                }
              </div>
              <div>
                {
                  showContext && 'replies' in props &&
                    props.replies.map(comment => (
                      <Comment
                        key={comment.id}
                        {...comment}
                        depth={props.depth + 1}
                        global={props.global}
                        page_type={props.page_type}
                        focusCommentID={focusCommentID}
                        contextAncestors={contextAncestors}
                      />
                    ))
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
