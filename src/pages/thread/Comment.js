import React from 'react'
import { Link } from 'react-router-dom'
import { prettyScore, parse, isRemoved, replaceAmpGTLT, jumpToHash } from 'utils'
import Time from 'pages/common/Time'
import RemovedBy from 'pages/common/RemovedBy'
import { connect } from 'state'
import { withRouter } from 'react-router'

const contextDefault = 3

class Comment extends React.Component {
  state = {
    displayBody: ! this.props.stickied
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
    const showContext = this.props.global.state.showContext
    const updateStateAndURL = this.props.global.selection_update
    const context_update = this.props.global.context_update

    let even_odd = ''
    if (!props.removed && !props.deleted) {
      even_odd = props.depth % 2 === 0 ? 'comment-even' : 'comment-odd'
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
    permalink += window.location.search
    let connectingChar = '?'
    const contextParam = `context=${contextDefault}#${props.name}`
    if (window.location.search) {
      connectingChar = '&'
    }
    const contextLink = permalink+connectingChar+contextParam
    let parent_link = undefined
    if ('parent_id' in props && props.parent_id.substr(0,2) === 't1') {
      parent_link = permalink.split('/').slice(0,6).join('/')+'/'+props.parent_id.substr(3)+'/'+window.location.search+'#'+props.parent_id
    }
    const name = `t1_${props.id}`
    let submitter = ''
    if (! props.deleted && author !== '[deleted]' && props.is_op) {
      submitter = ' submitter '
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
          <a onClick={() => this.toggleDisplayBody()} className='collapseToggle'>{this.getExpandIcon()}</a>
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
          <Time created_utc={props.created_utc}/>
          {props.locked && <span className='lockedTag'>locked</span>}
          <RemovedBy removedby={props.removedby} />
        </div>
        {
          this.state.displayBody ?
            <div className='comment-body-and-links'>
              <div className='comment-body' dangerouslySetInnerHTML={{ __html: innerHTML }} />
                <div className='comment-links'>
                { ! props.deleted &&
                  <React.Fragment>
                    <Link to={permalink} onClick={(e) => {context_update(0, props)}}>permalink</Link>
                    {parent_link &&
                      <Link to={parent_link} onClick={
                        (e) => {context_update(0, props,
                          () => {jumpToHash(window.location.hash)}
                          )}}>parent</Link>
                    }
                    <Link to={contextLink}
                          onClick={(e) => {context_update(contextDefault, props,
                          () => {jumpToHash(window.location.hash)}
                        )}}>context</Link>
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
                        location={props.location}
                        history={props.history}
                        page_type={props.page_type}
                        focusCommentID={props.focusCommentID}
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

export default withRouter(connect(Comment))
