import {localSort_types} from 'state'
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
  return (b.stickied - a.stickied) || (noNeg(a.score) - noNeg(b.score))
      || (b.replies.length - a.replies.length)
}
const byControversiality2 = (a, b) => {
  let a_score_abs = Math.abs(a.score)
  let b_score_abs = Math.abs(b.score)
  return (b.stickied - a.stickied) || (b.controversiality - a.controversiality)
      || (b.replies.length - a.replies.length) || (a_score_abs - b_score_abs)
}

const sortCommentTree = (comments, sortFunction) => {
  comments.sort(sortFunction)
  comments.forEach(comment => {
    if (comment?.replies.length > 0) {
      sortCommentTree(comment.replies, sortFunction)
    }
  })
}

export const applySelectedSort = (commentTree, localSort, localSortReverse) => {
  if (localSort === localSort_types.date) {
    sortCommentTree( commentTree, reversible(byDate, localSortReverse) )
  } else if (localSort === localSort_types.num_comments) {
    sortCommentTree( commentTree, reversible(byNumComments, localSortReverse) )
  } else if (localSort === localSort_types.score) {
    sortCommentTree( commentTree, reversible(byScore, localSortReverse) )
  } else if (localSort === localSort_types.controversiality1) {
    sortCommentTree( commentTree, reversible(byControversiality1, localSortReverse) )
  } else if (localSort === localSort_types.controversiality2) {
    sortCommentTree( commentTree, reversible(byControversiality2, localSortReverse) )
  } else if (localSort === localSort_types.comment_length) {
    sortCommentTree( commentTree, reversible(byCommentLength, localSortReverse) )
  }
}
