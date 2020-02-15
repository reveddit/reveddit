import React from 'react'
import Comment from './Comment'
import {connect, localSort_types, removedFilter_types, removedFilter_text} from 'state'
import { showRemovedAndDeleted } from 'utils'
import { NOT_REMOVED, REMOVAL_META, USER_REMOVED } from 'pages/common/RemovedBy'
import { itemIsOneOfSelectedRemovedBy, itemIsOneOfSelectedTags } from 'data_processing/filters'
import { reversible } from 'utils'
import { cloneDeep } from 'lodash'

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
    fullCommentTree: [],
    commentLookup: {}
  }
  componentDidMount() {
    const [fullCommentTree, commentLookup] = this.unflatten()
    this.setState({fullCommentTree, commentLookup})
  }

  arrayToLookup (commentList) {
    const lookup = {}
    commentList.forEach(comment => {
      comment.replies = []
      comment.ancestors = {}
      lookup['t1_'+comment.id] = comment
    })
    return lookup
  }

  unflatten () {
    const { postID } = this.props
    const lookup = this.arrayToLookup(this.props.global.state.items)
    const commentTree = []
    Object.keys(lookup)
      .sort((a,b) => lookup[a].created_utc - lookup[b].created_utc) // sort so ancestors are tracked properly
      .forEach(commentID => {
        const comment = lookup[commentID]

        const parentID = comment.parent_id
        if (parentID === postID) {
          commentTree.push(comment)
        } else if (lookup[parentID] === undefined) {
          console.error('MISSING PARENT ID:', parentID, 'for comment', comment)
        } else if (lookup[parentID]) {
          comment.ancestors = cloneDeep(lookup[parentID].ancestors)
          comment.ancestors[parentID] = true
          lookup[parentID].replies.push(comment)
        }
      })

    return [commentTree, lookup]
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

  itemIsOneOfSelectedTags_local = (item) => {
    return itemIsOneOfSelectedTags(item, this.props.global.state)
  }

  render() {
    const props = this.props
    const { focusCommentID, root, postID } = this.props
    const comments = this.props.global.state.items
    const { removedFilter, removedByFilter, localSort, localSortReverse, showContext, context } = props.global.state
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
    const tagsFilterIsUnset = this.props.global.tagsFilterIsUnset()

    const {fullCommentTree, commentLookup} = this.state
    let commentTreeSubset = fullCommentTree

    if (commentLookup[root] !== undefined) {
      commentTreeSubset = [commentLookup[root]]
    }
    let contextAncestors = {}
    if (context && focusCommentID && commentLookup['t1_'+focusCommentID]) {
      contextAncestors = commentLookup['t1_'+focusCommentID].ancestors
    }
    let commentTree = cloneDeep(commentTreeSubset)
    if (showContext) {
      if (removedFilter === removedFilter_types.removed) {
        this.filterCommentTree(commentTree, showRemovedAndDeleted)
      } else if (removedFilter === removedFilter_types.not_removed) {
        this.filterCommentTree(commentTree, showNotRemoved)
      }
      if (! removedByFilterIsUnset) {
        this.filterCommentTree(commentTree, this.itemIsOneOfSelectedRemovedBy_local)
      }
      if (! tagsFilterIsUnset) {
        this.filterCommentTree(commentTree, this.itemIsOneOfSelectedTags_local)
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
          page_type={props.page_type}
          focusCommentID={props.focusCommentID}
          contextAncestors={contextAncestors}
        />
      })
    } else if (removedFilter !== removedFilter_types.all) {
      status = (<p>No {removedFilter_text[removedFilter]} comments found</p>)
    }
    return (
      <div className='threadComments'>
        {comments_render}
        {status}
      </div>
    )
  }
}

export default connect(CommentSection)
