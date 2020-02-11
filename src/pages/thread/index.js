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
    const { items, loading, threadPost: post, hasVisitedUserPage, context } = this.props.global.state

    const { id, author } = post
    const { subreddit, threadID, urlTitle = '', commentID } = this.props.match.params
    const { selections, visibleItemsWithoutCategoryFilter } = this.props
    const linkToRestOfComments = `/r/${subreddit}/comments/${threadID}/${urlTitle}/`
    const isSingleComment = (commentID !== undefined)
    const removedFiltersAreUnset = this.props.global.removedFiltersAreUnset()
    const postID = `t3_${id}`
    let root = postID

    if (isSingleComment) {
      root = `t1_${commentID}`
      if (parseInt(context) && items.length) {
        const items_map = items.reduce((map, obj) => (map[obj.name] = obj, map), {})
        var i
        for (i = 0; i < context && (root in items_map) && items_map[root].parent_id.substr(0, 2) !== 't3'; i++) {
          root = items_map[root].parent_id
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
                  postID={postID}
                  comments={items}
                  visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                  page_type={this.props.page_type}
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
