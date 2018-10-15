import React from 'react'
import Comment from './Comment'
import {connect, sort, filter} from '../../state'
import {
  topSort, bottomSort, newSort, oldSort,
  showRemovedAndDeleted, showRemoved, showDeleted
} from '../../utils'


class CommentSection extends React.Component {
  arrayToLookup (commentList, removed, deleted) {
    const lookup = {}

    commentList.forEach(comment => {
      comment.replies = []

      if (removed.includes(comment.id)) {
        comment.removed = true
      } else if (deleted.includes(comment.id)) {
        comment.deleted = true
      }

      lookup[comment.id] = comment
    })

    return lookup
  }

  unflatten (comments, root, removed, deleted, link_author) {
    const lookup = this.arrayToLookup(comments, removed, deleted)
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
  render() {
    const props = this.props
    const commentTree = this.unflatten(props.comments, props.root, props.removed, props.deleted, props.link_author)
    const {commentFilter, commentSort} = props.global.state
    if (commentFilter === filter.removedDeleted) {
      this.filterCommentTree(commentTree, showRemovedAndDeleted)
    } else if (commentFilter === filter.removed) {
      this.filterCommentTree(commentTree, showRemoved)
    } else if (commentFilter === filter.deleted) {
      this.filterCommentTree(commentTree, showDeleted)
    }

    if (commentSort === sort.top) {
      this.sortCommentTree(commentTree, topSort)
    } else if (commentSort === sort.bottom) {
      this.sortCommentTree(commentTree, bottomSort)
    } else if (commentSort === sort.new) {
      this.sortCommentTree(commentTree, newSort)
    } else if (commentSort === sort.old) {
      this.sortCommentTree(commentTree, oldSort)
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
        : <p>No comments found</p>
    )
  }
}

export default connect(CommentSection)
