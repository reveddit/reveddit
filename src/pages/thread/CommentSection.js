import React, {useState} from 'react'
import Comment, { getMaxCommentDepth } from './Comment'
import {connect, removedFilter_types, removedFilter_text} from 'state'
import { NOT_REMOVED, REMOVAL_META, USER_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED } from 'pages/common/RemovedBy'
import { itemIsOneOfSelectedActions, itemIsOneOfSelectedTags, filterSelectedActions } from 'data_processing/filters'
import { createCommentTree } from 'data_processing/thread'
import { itemIsActioned, not } from 'utils'
import { Spin } from 'components/Misc'
import { textMatch } from 'pages/RevdditFetcher'
import { applySelectedSort } from './common'

const MAX_COMMENTS_TO_SHOW = 200

const flattenTree = (commentTree) => {
  const comments = []
  commentTree.forEach(comment =>
    comments.push(comment, ...flattenTree(comment.replies))
  )
  return comments
}

const filterCommentTree = (comments, filterFunction) => {
  if (comments.length === 0) {
    return false
  }

  let hasOkComment = false

  // Reverse for loop since we are removing stuff
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i]
    const isRepliesOk = filterCommentTree(comment.replies, filterFunction)
    const isCommentOk = filterFunction(comment)

    if (!isRepliesOk && !isCommentOk) {
      comments.splice(i, 1)
    } else {
      hasOkComment = true
    }
  }

  return hasOkComment
}

const countReplies = (comment, maxDepth, limitCommentDepth) => {
  let sum = comment.replies.length
  if (! limitCommentDepth || comment.depth < maxDepth-1) {
    comment.replies.forEach(c => {
      sum += countReplies(c, maxDepth, limitCommentDepth)
    })
  }
  return sum
}

const CommentSection = (props) => {
  const { global, focusCommentID, root, visibleItemsWithoutCategoryFilter,
          page_type,
        } = props
  const { removedFilter, removedByFilter, localSort,
          localSortReverse, showContext, context,
          itemsLookup: commentsLookup, commentTree: fullCommentTree,
          categoryFilter_author, keywords, user_flair,
          threadPost, limitCommentDepth, loading, tagsFilter,
          thread_before,
        } = global.state
  const [showAllComments, setShowAllComments] = useState(false)
  const removedByFilterIsUnset = global.removedByFilterIsUnset()
  const tagsFilterIsUnset = global.tagsFilterIsUnset()
  let numRootCommentsMatchOriginalCount = true
  let commentTreeSubset = fullCommentTree
  let origNumRootComments = null

  if (commentsLookup[root]) {
    commentTreeSubset = [commentsLookup[root]]
  }

  let contextAncestors = {}
  if (context && focusCommentID && commentsLookup[focusCommentID]) {
    contextAncestors = commentsLookup[focusCommentID].ancestors
  }
  let commentTree
  if (showContext) {
    [commentTree] = createCommentTree(threadPost.id, root, commentsLookup)
    origNumRootComments = commentTree.length
    if (removedFilter === removedFilter_types.removed) {
      filterCommentTree(commentTree, itemIsActioned)
    } else if (removedFilter === removedFilter_types.not_removed) {
      filterCommentTree(commentTree, not(itemIsActioned))
    }
    if (! removedByFilterIsUnset) {
      const filteredActions = filterSelectedActions(Object.keys(removedByFilter))
      filterCommentTree(commentTree, (item) => {
        return itemIsOneOfSelectedActions(item, ...filteredActions)
      })
    }
    if (! tagsFilterIsUnset) {
      filterCommentTree(commentTree, (item) => itemIsOneOfSelectedTags(item, global.state))
    }
  } else if (! focusCommentID || ! commentsLookup[focusCommentID]) {
    commentTree = visibleItemsWithoutCategoryFilter
  } else {
    commentTree = flattenTree(commentTreeSubset)
  }
  if (categoryFilter_author && categoryFilter_author !== 'all') {
    filterCommentTree(commentTree, (item) => item.author == categoryFilter_author)
  }
  if (keywords) {
    filterCommentTree(commentTree, (item) => textMatch(global.state, item, 'keywords', ['body']))
  }
  if (user_flair) {
    filterCommentTree(commentTree, (item) => textMatch(global.state, item, 'user_flair', ['author_flair_text']))
  }
  if (tagsFilter) {
    filterCommentTree(commentTree, (item) => {
      return itemIsOneOfSelectedTags(item, global.state)
    })
  }
  if (/^\d+$/.test(thread_before)) {
    filterCommentTree(commentTree, (item) => item.created_utc <= parseInt(thread_before))
  }
  applySelectedSort(commentTree, localSort, localSortReverse)
  let comments_render = []
  let status = ''
  let numCommentsShown = 0
  if (commentTree.length) {
    for (var i = 0; i < commentTree.length; i++) {
      if (limitCommentDepth && numCommentsShown >= MAX_COMMENTS_TO_SHOW && ! showAllComments) {
        comments_render.push(<div key="load-more"><a className='pointer' onClick={() => setShowAllComments(true)}>load more comments</a></div>)
        break
      }
      const comment = commentTree[i]
      numCommentsShown += countReplies(comment, getMaxCommentDepth(), limitCommentDepth)+1
      // any attributes added below must also be added to thread/Comment.js
      // in rest = {...}
      comments_render.push(<Comment
        key={[comment.id,categoryFilter_author,keywords,user_flair,thread_before].join('|')}
        {...comment}
        depth={0}
        page_type={page_type}
        focusCommentID={focusCommentID}
        contextAncestors={contextAncestors}
      />)
    }
    if (commentTree.length < origNumRootComments) {
      comments_render.push(<div key='show-all'><a className='pointer' onClick={() => global.resetFilters(page_type)}>▾ reset filters</a></div>)
    }
  } else if (removedFilter !== removedFilter_types.all) {
    status = (<p>No {removedFilter_text[removedFilter]} comments found</p>)
  }
  return (
    <>
      {loading && ! commentTree.length &&
        <Spin/>
      }
      <div className='threadComments'>
        {comments_render}
        {status}
      </div>
    </>
  )
}

export default connect(CommentSection)
