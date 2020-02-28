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
  render () {
    const { itemsLookup:comments, loading, threadPost: post, hasVisitedUserPage,
            context, showContext, initialFocusCommentID } = this.props.global.state

    const { id, author } = post
    const { subreddit, threadID, urlTitle = '', commentID } = this.props.match.params
    const { selections, visibleItemsWithoutCategoryFilter, page_type } = this.props
    const linkToRestOfComments = `/r/${subreddit}/comments/${threadID}/${urlTitle}/`
    const isSingleComment = (commentID !== undefined)
    const threadFiltersAreUnset = this.props.global.threadFiltersAreUnset()
    const updateStateAndURL = this.props.global.selection_update
    let root = undefined
    const numComments = Object.keys(comments).length

    if (isSingleComment) {
      root = commentID
      if (parseInt(context) && numComments) {
        var i
        for (i = 0; i < context && (root in comments) && comments[root].parent_id.substr(0, 2) !== 't3'; i++) {
          root = comments[root].parent_id.substr(3)
        }
      }
    }
    const resetThreadFilters = () => this.props.global.resetThreadFilters(page_type)
    const viewContext = <a className="pointer" onClick={() => updateStateAndURL('showContext', true, page_type)}>show context</a>
    let viewAllComments = <Link to={linkToRestOfComments} onClick={resetThreadFilters}>view all comments</Link>
    const resetFilters = <a className="pointer" onClick={resetThreadFilters}>reset filters</a>
    if (initialFocusCommentID) {
      viewAllComments = <a href={linkToRestOfComments}>view all comments</a>
    }

    return (
      <>
        <Post {...post} />
        {
          <>
            {selections}
            <Highlight/>
            {! hasVisitedUserPage &&
              <div className='notice-with-link userpage-note'>
                <div>{"Check if you have any removed comments."}</div>
                <Link to={'/user/'}>view my removed comments</Link>
              </div>
            }
            {(numComments !== 0 && (commentID || id)) &&
              <>
                {isSingleComment &&
                  <Notice message="you are viewing a single comment's thread." htmlLink={viewAllComments}/>
                }
                {! threadFiltersAreUnset &&
                  <Notice message="some comments may be hidden by selected filters." htmlLink={resetFilters}/>
                }
                {! showContext &&
                  <Notice message="context is flattened." htmlLink={viewContext}/>
                }
                <CommentSection
                  root={root}
                  visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                  page_type={page_type}
                  focusCommentID={commentID}
                />
              </>
            }
          </>
        }
      </>
    )
  }
}

export default connect(withFetch(Thread))
