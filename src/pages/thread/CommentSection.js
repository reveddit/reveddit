import React from 'react'
import { withRouter } from 'react-router';
import Comment from './Comment'
import {connect, localSort_types, removedFilter_types, removedFilter_text} from 'state'
import { showRemovedAndDeleted } from 'utils'
import { NOT_REMOVED, REMOVAL_META, USER_REMOVED } from 'pages/common/RemovedBy'
import { itemIsOneOfSelectedRemovedBy } from 'data_processing/filters'

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
  arrayToLookup (commentList) {
    const lookup = {}
    commentList.forEach(comment => {
      comment.replies = []
      lookup[comment.id] = comment
    })
    return lookup
  }

  unflatten (comments, root, link_author) {
    const lookup = this.arrayToLookup(comments)
    const commentTree = []
    Object.keys(lookup).forEach(commentID => {
      const comment = lookup[commentID]

      comment.link_author = link_author
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
    if (localSortReverse) {
      comments.reverse()
    }

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
    const comments = this.props.global.state.items
    const commentTree = this.unflatten(comments, props.root, props.link_author)
    const {removedFilter, removedByFilter, localSort, localSortReverse} = props.global.state
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()

    if (removedFilter === removedFilter_types.removed) {
      this.filterCommentTree(commentTree, showRemovedAndDeleted)
    } else if (removedFilter === removedFilter_types.not_removed) {
      this.filterCommentTree(commentTree, showNotRemoved)
    }
    if (! removedByFilterIsUnset) {
      this.filterCommentTree(commentTree, this.itemIsOneOfSelectedRemovedBy_local)
    }

    if (localSort === localSort_types.date) {
      this.sortCommentTree( commentTree, byDate )
    } else if (localSort === localSort_types.num_comments) {
      this.sortCommentTree( commentTree, byNumComments )
    } else if (localSort === localSort_types.score) {
      this.sortCommentTree( commentTree, byScore )
    } else if (localSort === localSort_types.controversiality1) {
      this.sortCommentTree( commentTree, byControversiality1 )
    } else if (localSort === localSort_types.controversiality2) {
      this.sortCommentTree( commentTree, byControversiality2 )
    }


    return (
      commentTree.length !== 0
        ? commentTree.map(comment => {
          return <Comment
            key={comment.id}
            {...comment}
            depth={0}
          />
        })
        : <p>No {removedFilter_text[removedFilter].replace('all','')} comments found</p>
    )
  }
}

export default withRouter(connect(CommentSection))
