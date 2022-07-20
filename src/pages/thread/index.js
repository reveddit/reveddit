import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import scrollToElement from 'scroll-to-element'
import { connect, localSort_types, urlParamKeys } from 'state'
import Post from 'pages/common/Post'
import {Notice, UserPageTip} from 'pages/common/Notice'
import CommentSection from './CommentSection'
import Selections from 'pages/common/selections'
import { withFetch } from 'pages/RevdditFetcher'
import { SimpleURLSearchParams, jumpToHash,
         PATH_STR_SUB,
} from 'utils'
import Highlight from 'pages/common/Highlight'
import { ShareLink } from 'components/Misc'

const Thread = connect(withFetch(withRouter(({global, ...props}) => {
  const { itemsLookup:comments, threadPost: post, hasVisitedUserPage,
          context, showContext, initialFocusCommentID, add_user,
        } = global.state

  const { id, author } = post
  const { subreddit, threadID, urlTitle = '', commentID } = props.match.params
  const { selections, summary,
          page_type, archiveDelayMsg, viewableItems,
        } = props
  const queryParams = new SimpleURLSearchParams()
  if (add_user) {
    queryParams.set(urlParamKeys.add_user, add_user)
  }
  const basePath = `${PATH_STR_SUB}/${subreddit}/comments/${threadID}/${urlTitle}/`
  const linkToRestOfComments = basePath+queryParams.toString()
  const isSingleComment = (commentID !== undefined)
  const updateStateAndURL = global.selection_update
  let root = undefined
  const numComments = Object.keys(comments).length

  if (isSingleComment) {
    root = commentID
    if (parseInt(context) && numComments) {
      var i
      for (i = 0; i < context && (root in comments) && comments[root].parent_id.substr(0, 2) !== 't3'; i++) {
        const parent_id = comments[root].parent_id.substr(3)
        if (comments[parent_id]) {
          root = comments[root].parent_id.substr(3)
        }
      }
    }
  }
  if (context) {
    queryParams.set(urlParamKeys.context, context)
  }
  const shareLink = basePath + (commentID ? commentID + '/' : '') + queryParams.toString()
  const resetFilters_func = () => global.resetFilters(page_type)
  const viewContext = <a className="pointer" onClick={() => updateStateAndURL('showContext', true, page_type)}>show context</a>
  let viewAllComments = <Link to={linkToRestOfComments} onClick={resetFilters_func}>view all comments</Link>
  const resetFilters = <a className="pointer" onClick={resetFilters_func}>reset filters</a>
  if (initialFocusCommentID) {
    viewAllComments = <a href={linkToRestOfComments}>view all comments</a>
  }
  return (
    <>
      <ShareLink href={shareLink}/>
      {selections}
      <Post {...post} page_type={page_type} />
      {summary}
      <Highlight/>
      {archiveDelayMsg}
      {! hasVisitedUserPage &&
        <UserPageTip/>
      }
      {(numComments !== 0 && (commentID || id)) &&
        <>
          {isSingleComment &&
            <Notice message="you are viewing a single comment's thread." htmlLink={viewAllComments}/>
          }
          {! showContext &&
            <Notice message="context is flattened." htmlLink={viewContext}/>
          }
          <CommentSection
            root={root}
            page_type={page_type}
            focusCommentID={commentID}
            viewableItems={viewableItems}
          />
        </>
      }
    </>
  )
})))

export default Thread
