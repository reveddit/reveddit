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

const countReplies = (comment, maxDepth, limitCommentDepth, visibleComments) => {
  const visibleReplies = visibleComments[comment.name] || []
  let sum = visibleReplies.length
  if (! limitCommentDepth || comment.depth < maxDepth-1) {
    visibleReplies.forEach(c => {
      sum += countReplies(c, maxDepth, limitCommentDepth, visibleComments)
    })
  }
  return sum
}

const CommentSection = (props) => {
  const { global, focusCommentID, root,
          page_type, viewableItems,
        } = props
  const { removedFilter, removedByFilter, exclude_action, localSort,
          localSortReverse, showContext, context,
          itemsLookup: commentsLookup, commentTree,
          categoryFilter_author, keywords, user_flair,
          threadPost, limitCommentDepth, loading, tagsFilter, exclude_tag,
          thread_before, items, add_user, add_user_on_page_load,
        } = global.state
  const [showAllComments, setShowAllComments] = useState(false)
  const [showFilteredRootComments, setShowFilteredRootComments] = useState(false)
  const [showSingleRoot, setShowSingleRoot] = useState(false)
  const [visibleComments, setVisibleComments] = useState({})
  const [numVisibleReplies, setNumVisibleReplies] = useState({})
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
    filterFunctions.push((item) => textMatch(global.state, item, ['keywords', ['body']]))
  }
  if (user_flair) {
    filterFunctions.push((item) => textMatch(global.state, item, ['user_flair', ['author_flair_text']]))
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
    const sortFn = getSortFn(localSort, global.state)
    for (const list of Object.values(visibleComments)) {
      list.sort(reversible(sortFn, localSortReverse))
    }
  }
  const rootFullID = root ? 't1_'+root : threadPost.name

  const setAndCountVisibleComments = (visibleComments, showContext) => {
    const numVisibleReplies = {}
    if (showContext) {
      const maxCommentDepth = getMaxCommentDepth()
      for (const [parent_fullID, children] of Object.entries(visibleComments)) {
        if (parent_fullID.substr(0,2) !== 't3') {
          numVisibleReplies[parent_fullID] = 0
          for (const comment of visibleComments[parent_fullID]) {
            numVisibleReplies[parent_fullID] += countReplies(comment, maxCommentDepth, limitCommentDepth, visibleComments)
          }
        }
      }
    }
    setNumVisibleReplies(numVisibleReplies)
    setVisibleComments(visibleComments)
  }

  // Sort Effect: This effect must appear first. When placed below the filter effect, this one
  // results in unsynced display, some items hidden on page load with no filters
  useEffect(() => {
    // since filters effect includes a sort, only need to run this when not loading
    if (! loading) {
      sortVisibleComments(visibleComments)
      setAndCountVisibleComments(visibleComments, showContext)
    }
  }, [localSort, localSortReverse, loading, items.length])
  // Filter effect
  useEffect(() => {
    const visibleComments = {}
    filterCommentTree(commentTree, commentsLookup, visibleComments, (item) => filterFunctions.every(f => f(item)))
    if (! showContext) {
      if (! focusCommentID || ! commentsLookup[focusCommentID]) {
        visibleComments[rootFullID] = viewableItems
      } else {
        //need to filter a second time here b/c an uptree comment might be marked visible due to something below it.
        //in flat view, don't want to show unmatched uptree comments
        visibleComments[rootFullID] = flattenTree(rootFullID, visibleComments).filter(item => filterFunctions.every(f => f(item)))
        if (root && commentsLookup[root] && filterFunctions.every(f => f(commentsLookup[root]))) {
          visibleComments[rootFullID].push(commentsLookup[root])
        }
      }
    }
    sortVisibleComments(visibleComments)
    setAndCountVisibleComments(visibleComments, showContext)
  }, [filters_str, showContext, items.length, context, focusCommentID, root, add_user, add_user_on_page_load])

  useEffect(() => {
    if (showFilteredRootComments || (showSingleRoot && origRootComments.length === 1)) {
      const newRootComments = [...origRootComments]
      sortVisibleComments({[rootFullID]: newRootComments})
      visibleComments[rootFullID] = newRootComments
      setAndCountVisibleComments({...visibleComments}, showContext)
    }
  }, [showFilteredRootComments, showSingleRoot, origRootComments.length])
  let comments_render = []
  let status = ''
  let numCommentsShown = 0

  useEffect(() => {
    setShowFilteredRootComments(false)
  }, [filters_str])
  let rootComments
  if (! showContext && visibleComments[rootFullID]) {
    rootComments = visibleComments[rootFullID]
  } //Below condition is for when a commentID is set. visibleComments only tracks replies and can't be used here
  else if (root && commentsLookup[root]) {
    rootComments = [commentsLookup[root]]
  } else {
    rootComments = visibleComments[threadPost.name] || []
  }
  for (const comment of rootComments) {
    if (limitCommentDepth && numCommentsShown >= MAX_COMMENTS_TO_SHOW && ! showAllComments) {
      comments_render.push(<div key="load-more"><a className='pointer' onClick={() => setShowAllComments(true)}>load more comments</a></div>)
      break
    }
    numCommentsShown += showContext ? (numVisibleReplies[comment.name] || 0)+1 : 1
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

  if (numRepliesHiddenByFilters > 0 && showContext) {
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
