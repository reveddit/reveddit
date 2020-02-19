import React from 'react'
import { Link } from 'react-router-dom'
import scrollToElement from 'scroll-to-element'
import { connect, localSort_types } from 'state'
import Post from 'pages/common/Post'
import Notice from 'pages/common/Notice'
import CommentSection from './CommentSection'
import Selections from 'pages/common/selections'
import { withFetch } from 'pages/RevdditFetcher'
import { SimpleURLSearchParams, jumpToHash } from 'utils'
import Highlight from 'pages/common/Highlight'

class Thread extends React.Component {
  componentDidUpdate() {
    if (window.location.hash) {
      jumpToHash(window.location.hash)
    }
  }

  render () {
    const { itemsLookup:comments, loading, threadPost, hasVisitedUserPage, context, redditThreadPost } = this.props.global.state
    let post = redditThreadPost
    if ('id' in threadPost) {
      post = threadPost
    }
    const { id, author } = post
    const { subreddit, threadID, urlTitle = '', commentID } = this.props.match.params
    const { selections, visibleItemsWithoutCategoryFilter, page_type } = this.props
    const linkToRestOfComments = `/r/${subreddit}/comments/${threadID}/${urlTitle}/`
    const isSingleComment = (commentID !== undefined)
    const removedFiltersAreUnset = this.props.global.removedFiltersAreUnset()
    let root = undefined

    if (isSingleComment) {
      root = commentID
      if (parseInt(context) && Object.keys(comments).length) {
        var i
        for (i = 0; i < context && (root in comments) && comments[root].parent_id.substr(0, 2) !== 't3'; i++) {
          root = comments[root].parent_id.substr(3)
        }
      }
    }
    const viewAllComments = <Link to={linkToRestOfComments} onClick={this.props.global.resetRemovedFilters}>view all comments</Link>

    return (
      <React.Fragment>
        <Post {...post} />
        {
          <React.Fragment>
            {selections}
            <Highlight/>
            {! hasVisitedUserPage &&
              <div className='notice-with-link userpage-note'>
                <div>{"Check if you have any removed comments."}</div>
                <Link to={'/user/'}>view my removed comments</Link>
              </div>
            }
            {(!loading && (commentID || id)) &&
              <React.Fragment>
                {isSingleComment &&
                  <Notice message="you are viewing a single comment's thread." htmlLink={viewAllComments}/>
                }
                {! isSingleComment && ! removedFiltersAreUnset &&
                  <Notice message="some comments may be hidden by selected filters." htmlLink={viewAllComments}/>
                }
                <CommentSection
                  root={root}
                  visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                  page_type={page_type}
                  focusCommentID={commentID}
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
