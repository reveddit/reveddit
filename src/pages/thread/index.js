import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import scrollToElement from 'scroll-to-element'
import { connect, localSort_types } from 'state'
import Post from 'pages/common/Post'
import CommentSection from './CommentSection'
import Selections from 'pages/common/selections'
import { withFetch } from 'pages/RevdditFetcher'

class Thread extends React.Component {

  render () {
    const post = this.props.threadPost
    const { id, author } = post
    const { subreddit, threadID, urlTitle = '', commentID } = this.props.match.params
    const { items, loading, selections } = this.props
    const linkToRestOfComments = `/r/${subreddit}/comments/${threadID}/${urlTitle}`
    const isSingleComment = (commentID !== undefined && ! this.props.history.location.hash)
    const root = isSingleComment ? commentID : id
    const removedFiltersAreUnset = this.props.global.removedFiltersAreUnset()

    return (
      <React.Fragment>
        <Post {...post} />
        {
          <React.Fragment>
            {selections}
            {(!loading && root) &&
              <React.Fragment>
                {isSingleComment &&
                  <div className='view-rest-of-comment'>
                    <div>{"you are viewing a single comment's thread."}</div>
                    <Link to={linkToRestOfComments} onClick={this.props.global.resetRemovedFilters}>view all comments</Link>
                  </div>
                }
                {! isSingleComment && ! removedFiltersAreUnset &&
                  <div className='view-rest-of-comment'>
                    <div>{"some comments may be hidden by selected filters."}</div>
                    <Link to={linkToRestOfComments} onClick={this.props.global.resetRemovedFilters}>view all comments</Link>
                  </div>
                }
                <CommentSection
                  root={root}
                  comments={items}
                  link_author={author}
                  isSingleComment={isSingleComment}
                />
              </React.Fragment>
            }
          </React.Fragment>
        }
      </React.Fragment>
    )
  }
}

export default connect(withFetch(Thread))
