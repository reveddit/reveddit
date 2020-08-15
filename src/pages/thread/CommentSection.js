import React from 'react'
import Comment from './Comment'
import {connect, localSort_types, removedFilter_types, removedFilter_text} from 'state'
import { NOT_REMOVED, REMOVAL_META, USER_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED } from 'pages/common/RemovedBy'
import { itemIsOneOfSelectedActions, itemIsOneOfSelectedTags, filterSelectedActions } from 'data_processing/filters'
import { createCommentTree } from 'data_processing/thread'
import { reversible, itemIsActioned, not } from 'utils'
import { getMaxCommentDepth } from 'pages/thread/Comment'
import { Spin } from 'components/Misc'

const MAX_COMMENTS_TO_SHOW = 200

const byScore = (a, b) => {
  return (b.stickied - a.stickied) || (b.score - a.score)
      || (b.replies.length - a.replies.length)
}
const byDate = (a, b) => {
  return (b.stickied - a.stickied) || (b.created_utc - a.created_utc)
      || (b.replies.length - a.replies.length)
}
const byNumComments = (a, b) => {
  return (b.stickied - a.stickied) || (b.replies.length - a.replies.length)
      || (b.created_utc - a.created_utc)
}
const byCommentLength = (a, b) => {
  return (b.body.length - a.body.length) || (b.score - a.score) || (b.created_utc - a.created_utc)
}
const noNeg = (n) => {
  return n < 0 ? 0 : n
}
const byControversiality1 = (a, b) => {
  let a_score_noneg = a.score < 0 ? 0 : a.score
  let b_score_noneg = b.score < 0 ? 0 : b.score
  return (b.stickied - a.stickied) || (a_score_noneg - b_score_noneg)
      || (b.replies.length - a.replies.length)
}
const byControversiality2 = (a, b) => {
  let a_score_abs = Math.abs(a.score)
  let b_score_abs = Math.abs(b.score)
  return (b.stickied - a.stickied) || (b.controversiality - a.controversiality)
      || (b.replies.length - a.replies.length) || (a_score_abs - b_score_abs)
}

const flattenTree = (commentTree) => {
  const comments = []
  commentTree.forEach(comment =>
    comments.push(comment, ...flattenTree(comment.replies))
  )
  return comments
}



class CommentSection extends React.Component {
  state = {
    showAllComments: false
  }
  setShowAllComments = () => {
    this.setState({showAllComments: true})
  }
  countReplies = (comment, maxDepth) => {
    let sum = comment.replies.length
    if (! this.props.global.state.limitCommentDepth || comment.depth < maxDepth-1) {
      comment.replies.forEach(c => {
        sum += this.countReplies(c, maxDepth)
      })
    }
    return sum
  }
  sortCommentTree (comments, sortFunction) {
    const {localSortReverse} = this.props.global.state

    comments.sort(sortFunction)

    comments.forEach(comment => {
      if (comment.replies.length > 0) {
        this.sortCommentTree(comment.replies, sortFunction)
      }
    })
  }

  filterCommentTree (comments, filterFunction) {
    if (comments.length === 0) {
      return false
    }

    let hasOkComment = false

    // Reverse for loop since we are removing stuff
    for (let i = comments.length - 1; i >= 0; i--) {
      const comment = comments[i]
      const isRepliesOk = this.filterCommentTree(comment.replies, filterFunction)
      const isCommentOk = filterFunction(comment)

      if (!isRepliesOk && !isCommentOk) {
        comments.splice(i, 1)
      } else {
        hasOkComment = true
      }
    }

    return hasOkComment
  }

  itemIsOneOfSelectedTags_local = (item) => {
    return itemIsOneOfSelectedTags(item, this.props.global.state)
  }

  render() {
    const props = this.props
    const { focusCommentID, root } = this.props
    const { removedFilter, removedByFilter, localSort,
            localSortReverse, showContext, context,
            itemsLookup: commentsLookup, commentTree: fullCommentTree,
            threadPost, limitCommentDepth, loading } = props.global.state
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
    const tagsFilterIsUnset = this.props.global.tagsFilterIsUnset()

    let commentTreeSubset = fullCommentTree

    if (commentsLookup[root]) {
      commentTreeSubset = [commentsLookup[root]]
    }
    let contextAncestors = {}
    if (context && focusCommentID && commentsLookup[focusCommentID]) {
      contextAncestors = commentsLookup[focusCommentID].ancestors
    }
    let commentTree
    if (showContext) {
      commentTree = createCommentTree(threadPost.id, root, commentsLookup)
      if (removedFilter === removedFilter_types.removed) {
        this.filterCommentTree(commentTree, itemIsActioned)
      } else if (removedFilter === removedFilter_types.not_removed) {
        this.filterCommentTree(commentTree, not(itemIsActioned))
      }
      if (! removedByFilterIsUnset) {
        const filteredActions = filterSelectedActions(Object.keys(this.props.global.state.removedByFilter))
        this.filterCommentTree(commentTree, (item) => {
          return itemIsOneOfSelectedActions(item, ...filteredActions)
        })
      }
      if (! tagsFilterIsUnset) {
        this.filterCommentTree(commentTree, this.itemIsOneOfSelectedTags_local)
      }
    } else if (! focusCommentID || ! commentsLookup[focusCommentID]) {
      commentTree = this.props.visibleItemsWithoutCategoryFilter
    } else {
      commentTree = flattenTree(commentTreeSubset)
    }

    if (localSort === localSort_types.date) {
      this.sortCommentTree( commentTree, reversible(byDate, localSortReverse) )
    } else if (localSort === localSort_types.num_comments) {
      this.sortCommentTree( commentTree, reversible(byNumComments, localSortReverse) )
    } else if (localSort === localSort_types.score) {
      this.sortCommentTree( commentTree, reversible(byScore, localSortReverse) )
    } else if (localSort === localSort_types.controversiality1) {
      this.sortCommentTree( commentTree, reversible(byControversiality1, localSortReverse) )
    } else if (localSort === localSort_types.controversiality2) {
      this.sortCommentTree( commentTree, reversible(byControversiality2, localSortReverse) )
    } else if (localSort === localSort_types.comment_length) {
      this.sortCommentTree( commentTree, reversible(byCommentLength, localSortReverse) )
    }
    let comments_render = []
    let status = ''
    let numCommentsShown = 0
    if (commentTree.length) {
      for (var i = 0; i < commentTree.length; i++) {
        if (limitCommentDepth && numCommentsShown >= MAX_COMMENTS_TO_SHOW && ! this.state.showAllComments) {
          comments_render.push(<a key="load-more" className='pointer' onClick={this.setShowAllComments}>load more comments</a>)
          break
        }
        const comment = commentTree[i]
        numCommentsShown += this.countReplies(comment, getMaxCommentDepth())+1
        // any attributes added below must also be added to thread/Comment.js
        // in prop.replies.map(...)
        comments_render.push(<Comment
          key={comment.id}
          {...comment}
          depth={0}
          page_type={props.page_type}
          focusCommentID={props.focusCommentID}
          contextAncestors={contextAncestors}
        />)
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
}

export default connect(CommentSection)
