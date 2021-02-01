import React, {useState, useEffect} from 'react'
import Comment, { getMaxCommentDepth } from './Comment'
import {connect, removedFilter_types, removedFilter_text} from 'state'
import { NOT_REMOVED, REMOVAL_META, USER_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED } from 'pages/common/RemovedBy'
import { itemIsOneOfSelectedActions, itemIsOneOfSelectedTags, filterSelectedActions } from 'data_processing/filters'
import { itemIsActioned, not, reversible } from 'utils'
import { Spin } from 'components/Misc'
import { textMatch } from 'pages/RevdditFetcher'
import { getSortFn } from './common'

const MAX_COMMENTS_TO_SHOW = 200

const flattenTree = (rootFullID, visibleComments) => {
  const flattenedComments = []
  for (const comment of Object.values(visibleComments[rootFullID] || {})) {
    flattenedComments.push(comment, ...flattenTree('t1_'+comment.id, visibleComments))
  }
  return flattenedComments
}

const filterCommentTree = (commentTree, commentsLookup, visibleComments, filterFunction) => {
  if (commentTree.length === 0) {
    return false
  }

  let hasOkComment = false

  // Reverse for loop since we are removing stuff
  for (let i = commentTree.length - 1; i >= 0; i--) {
    const comment = commentTree[i]
    const isRepliesOk = filterCommentTree(comment.replies, commentsLookup, visibleComments, filterFunction)
    const isCommentOk = filterFunction(comment)

    if (isRepliesOk || isCommentOk) {
      if (! visibleComments[comment.parent_id]) {
        visibleComments[comment.parent_id] = []
      }
      //loading from commentsLookup because the object in commentTree
      //is not in sync with commentsLookup for add_user-modified objects, even when just copying fields
      //don't know how that's happening
      visibleComments[comment.parent_id].push(commentsLookup[comment.id])
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
  const { global, focusCommentID, root,
          page_type,
        } = props
  const { removedFilter, removedByFilter, exclude_action, localSort,
          localSortReverse, showContext, context,
          itemsLookup: commentsLookup, commentTree,
          categoryFilter_author, keywords, user_flair,
          threadPost, limitCommentDepth, loading, tagsFilter, exclude_tag,
          thread_before, items, add_user,
        } = global.state
  const [showAllComments, setShowAllComments] = useState(false)
  const [showFilteredRootComments, setShowFilteredRootComments] = useState(false)
  const [showSingleRoot, setShowSingleRoot] = useState(false)
  const [visibleComments, setVisibleComments] = useState({})
  const removedByFilterIsUnset = global.removedByFilterIsUnset()
  const tagsFilterIsUnset = global.tagsFilterIsUnset()
  let numRootCommentsMatchOriginalCount = true
  let removedByFilter_str = '', tagsFilter_str = ''
  let contextAncestors = {}
  const filterFunctions = []
  if (context && focusCommentID && commentsLookup[focusCommentID]) {
    contextAncestors = commentsLookup[focusCommentID].ancestors
    filterFunctions.push((item) => (
      contextAncestors[item.id] ||
      item.id === focusCommentID ||
      item.ancestors[focusCommentID]
    ))
  }
  const origRootComments = root ? commentsLookup[root] || []: commentTree
  if (removedFilter === removedFilter_types.removed) {
    filterFunctions.push(itemIsActioned)
  } else if (removedFilter === removedFilter_types.not_removed) {
    filterFunctions.push(not(itemIsActioned))
  }
  if (! removedByFilterIsUnset) {
    const filteredActions = filterSelectedActions(Object.keys(removedByFilter))
    removedByFilter_str = filteredActions.join()
    const removedBy_func = (item) => itemIsOneOfSelectedActions(item, ...filteredActions)
    filterFunctions.push(exclude_action ? not(removedBy_func) : removedBy_func)
  }
  if (! tagsFilterIsUnset) {
    tagsFilter_str = Object.keys(tagsFilter).join()
    const tag_func = (item) => itemIsOneOfSelectedTags(item, global.state)
    filterFunctions.push(exclude_tag ? not(tag_func) : tag_func)
  }
  if (keywords) {
    filterFunctions.push((item) => textMatch(global.state, item, 'keywords', ['body']))
  }
  if (user_flair) {
    filterFunctions.push((item) => textMatch(global.state, item, 'user_flair', ['author_flair_text']))
  }
  if (/^\d+$/.test(thread_before)) {
    filterFunctions.push((item) => item.created_utc <= parseInt(thread_before))
  }
  if (categoryFilter_author && categoryFilter_author !== 'all') {
    filterFunctions.push((item) => item.author == categoryFilter_author)
  }
  const filters_str = [
    removedFilter,removedByFilter_str,categoryFilter_author,tagsFilter_str,
    keywords,user_flair,thread_before,focusCommentID,
    ...[showContext,limitCommentDepth,exclude_action,exclude_tag].map(x => x.toString()),
  ].join('|')
  const sortVisibleComments = (visibleComments) => {
    const sortFn = getSortFn(localSort)
    for (const list of Object.values(visibleComments)) {
      list.sort(reversible(sortFn, localSortReverse))
    }
  }
  const rootFullID = root ? 't1_'+root : threadPost.name
  // Sort Effect: This effect must appear first. When placed below the filter effect, this one
  // results in unsynced display, some items hidden on page load with no filters
  useEffect(() => {
    // since filters effect includes a sort, only need to run this when not loading
    if (! loading) {
      sortVisibleComments(visibleComments)
      setVisibleComments(visibleComments)
    }
  }, [localSort, localSortReverse, loading, items.length])
  // Filter effect
  useEffect(() => {
    const visibleComments = {}
    filterCommentTree(commentTree, commentsLookup, visibleComments, (item) => filterFunctions.every(f => f(item)))
    if (! showContext) {
      visibleComments[rootFullID] = flattenTree(rootFullID, visibleComments)
      if (root && commentsLookup[root]) {
        visibleComments[rootFullID].push(commentsLookup[root])
      }
    }
    sortVisibleComments(visibleComments)
    setVisibleComments(visibleComments)
    // append sort vars since the sort effect isn't working
  }, [filters_str, showContext, items.length, context, focusCommentID, root, add_user])

  useEffect(() => {
    if (showFilteredRootComments || (showSingleRoot && origRootComments.length === 1)) {
      const newRootComments = [...origRootComments]
      sortVisibleComments({[rootFullID]: newRootComments})
      visibleComments[rootFullID] = newRootComments
      setVisibleComments({...visibleComments})
    }
  }, [showFilteredRootComments, showSingleRoot, origRootComments.length])
  let comments_render = []
  let status = ''
  let numCommentsShown = 0

  useEffect(() => {
    setShowFilteredRootComments(false)
  }, [filters_str])
  const rootComments = root && commentsLookup[root] ? [commentsLookup[root]] : visibleComments[threadPost.name] || []
  for (const comment of rootComments) {
    if (limitCommentDepth && numCommentsShown >= MAX_COMMENTS_TO_SHOW && ! showAllComments) {
      comments_render.push(<div key="load-more"><a className='pointer' onClick={() => setShowAllComments(true)}>load more comments</a></div>)
      break
    }
    //countReplies could be,
    //   - computed in a hook & adjusted to use visibleComments, or
    //   - omitted by using react-window
    numCommentsShown += countReplies(comment, getMaxCommentDepth(), limitCommentDepth)+1
    // any attributes added below must also be added to thread/Comment.js
    // in rest = {...}
    comments_render.push(<Comment
      key={[comment.id,comment.removedby || '',(visibleComments[comment.name] || []).length.toString(),filters_str].join('|')}
      {...comment}
      depth={0}
      page_type={page_type}
      focusCommentID={focusCommentID}
      contextAncestors={contextAncestors}
      setShowSingleRoot={setShowSingleRoot}
      visibleComments={visibleComments}
    />)
  }
  if (! rootComments.length && removedFilter !== removedFilter_types.all) {
    status = (<p>No {removedFilter_text[removedFilter]} comments found</p>)
  }
  const numRepliesHiddenByFilters = origRootComments.length - rootComments.length

  if (numRepliesHiddenByFilters) {
    comments_render.push(
      <div key='show-all'>
        <a className='pointer' onClick={() => setShowFilteredRootComments(true)}>▾ show hidden replies ({numRepliesHiddenByFilters.toLocaleString()})</a>
      </div>)
  }
  return (
    <>
      {loading && ! rootComments.length &&
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
