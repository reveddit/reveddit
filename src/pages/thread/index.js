import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import scrollToElement from 'scroll-to-element'
import { connect, localSort_types } from 'state'
import Post from 'pages/common/Post'
import CommentSection from './CommentSection'
import Selections from 'pages/common/selections'
import { withFetch } from 'pages/RevdditFetcher'
import { SimpleURLSearchParams, jumpToHash } from 'utils'

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
    const linkToRestOfComments = `/r/${subreddit}/comments/${threadID}/${urlTitle}`
    const isSingleComment = (commentID !== undefined)
    const removedFiltersAreUnset = this.props.global.removedFiltersAreUnset()

    let root = `t3_${id}`

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

    return (
      <React.Fragment>
        <Post {...post} />
        {
          <React.Fragment>
            {selections}
            {! hasVisitedUserPage &&
              <div className='notice-with-link'>
                <div>{"Check if you have any removed comments."}</div>
                <Link to={'/user'}>view my removed comments</Link>
              </div>
            }
            {(!loading && (commentID || id)) &&
              <React.Fragment>
                {isSingleComment &&
                  <div className='notice-with-link'>
                    <div>{"you are viewing a single comment's thread."}</div>
                    <Link to={linkToRestOfComments} onClick={this.props.global.resetRemovedFilters}>view all comments</Link>
                  </div>
                }
                {! isSingleComment && ! removedFiltersAreUnset &&
                  <div className='notice-with-link'>
                    <div>{"some comments may be hidden by selected filters."}</div>
                    <Link to={linkToRestOfComments} onClick={this.props.global.resetRemovedFilters}>view all comments</Link>
                  </div>
                }
                <CommentSection
                  root={root}
                  comments={items}
                  isSingleComment={isSingleComment}
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
