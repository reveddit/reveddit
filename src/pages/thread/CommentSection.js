import React from 'react'
import { withRouter } from 'react-router';
import Comment from './Comment'
import {connect, localSort_types, removedFilter_types, removedFilter_text} from 'state'
import { showRemovedAndDeleted } from 'utils'
import { NOT_REMOVED, REMOVAL_META, USER_REMOVED } from 'pages/common/RemovedBy'
import { itemIsOneOfSelectedRemovedBy } from 'data_processing/filters'
import { reversible } from 'utils'

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

const showNotRemoved = comment => comment.removedby === NOT_REMOVED && ! comment.deleted

class CommentSection extends React.Component {
  state = {
    commentTree: []
  }

  arrayToLookup (commentList) {
    const lookup = {}
    commentList.forEach(comment => {
      comment.replies = []
      lookup['t1_'+comment.id] = comment
    })
    return lookup
  }

  unflatten () {
    const { root } = this.props
    const lookup = this.arrayToLookup(this.props.global.state.items)
    const commentTree = []
    Object.keys(lookup).forEach(commentID => {
      const comment = lookup[commentID]

      const parentID = comment.parent_id
      if (parentID === root) {
        commentTree.push(comment)
      } else {
        if (lookup[parentID] === undefined && ! this.props.isSingleComment) {
          console.error('MISSING PARENT ID:', parentID, 'for comment', comment)
          return
        } else if (lookup[parentID]) {
          lookup[parentID].replies.push(comment)
        }
      }
    })

    if (lookup[root] !== undefined) {
      lookup[root].replies = commentTree
      return [lookup[root]]
    }

    return commentTree
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

  itemIsOneOfSelectedRemovedBy_local = (item) => {
    return itemIsOneOfSelectedRemovedBy(item, this.props.global.state)
  }

  render() {
    const props = this.props
    const { focusCommentID } = this.props
    const comments = this.props.global.state.items
    const { removedFilter, removedByFilter, localSort, localSortReverse, showContext } = props.global.state
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()

    let commentTree = []
    if (showContext) {
      //issue: clicking any filter is inefficient b/c it rebuilds the whole tree each time
      // fix: 1. move unflatten() to componentDidMount() and save result to local state
      //      2. rewrite filterCommentTree to return copies of objects rather than splicing
      // why: unflatten() is called every time a filter is changed b/c
      //      filterCommentTree() below will splice the comment.replies lists, and after splicing,
      //      they don't "come back", e.g. clicking "show removed" then "show all" would lose comments
      //      if only fix #1 is applied
      commentTree = this.unflatten()
      if (removedFilter === removedFilter_types.removed) {
        this.filterCommentTree(commentTree, showRemovedAndDeleted)
      } else if (removedFilter === removedFilter_types.not_removed) {
        this.filterCommentTree(commentTree, showNotRemoved)
      }
      if (! removedByFilterIsUnset) {
        this.filterCommentTree(commentTree, this.itemIsOneOfSelectedRemovedBy_local)
      }
    } else {
      commentTree = this.props.visibleItemsWithoutCategoryFilter
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
    if (commentTree.length) {
      comments_render = commentTree.map(comment => {
        // any attributes added below must also be added to thread/Comment.js
        // in prop.replies.map(...)
        return <Comment
          key={comment.id}
          {...comment}
          depth={0}
          link_author={props.link_author}
          page_type={props.page_type}
          focusCommentID={props.focusCommentID}
        />
      })
    } else if (removedFilter !== removedFilter_types.all) {
      status = (<p>No {removedFilter_text[removedFilter]} comments found</p>)
    }
    return (
      <>
        {comments_render}
        {status}
      </>
    )
  }
}

export default withRouter(connect(CommentSection))
