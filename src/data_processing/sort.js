import { localSort_types } from 'state'

const posts_byScore = (a, b) => {
  return (b.stickied - a.stickied) || (b.score - a.score)
      || (b.num_comments - a.num_comments)
}
const posts_byDate = (a, b) => {
  return (b.stickied - a.stickied) || (b.created_utc - a.created_utc)
      || (b.num_comments - a.num_comments)
}
const posts_byNumComments = (a, b) => {
  return (b.stickied - a.stickied) || (b.num_comments - a.num_comments)
      || (b.created_utc - a.created_utc)
}
const posts_byControversiality = (a, b) => {
  return (b.stickied - a.stickied) || (a.score - b.score)
      || (b.num_comments - a.num_comments)
}
const posts_byNumCrossposts = (a, b) => {
  if ('num_crossposts' in a && 'num_crossposts' in b) {
    return (b.num_crossposts - a.num_crossposts) || (b.num_comments - a.num_comments)
        || (b.created_utc - a.created_utc)
  } if ('num_crossposts' in a) {
    return -1
  } else if ('num_crossposts' in b) {
    return 1
  } else {
    return (b.created_utc - a.created_utc)
  }
}

const comments_byDateObserved = (a, b) => {
  return (b.observed_utc - a.observed_utc)
}
const comments_byCommentLength = (a, b) => {
  return (b.body.length - a.body.length) || (b.score - a.score) || (b.created_utc - a.created_utc)
}
const comments_byControversiality1 = (a, b) => {
  let a_score_noneg = a.score < 0 ? 0 : a.score
  let b_score_noneg = b.score < 0 ? 0 : b.score
  return (a_score_noneg - b_score_noneg)
}
const comments_byControversiality2 = (a, b) => {
  let a_score_abs = Math.abs(a.score)
  let b_score_abs = Math.abs(b.score)
  return (b.controversiality - a.controversiality) || (a_score_abs - b_score_abs)
}

const items_byScore = (a, b) => {
  return (b.score - a.score)
}
const items_byDate = (a, b) => {
  return (b.created_utc - a.created_utc)
}
const items_byNumComments = (a, b) => {
  if ('num_comments' in a && 'num_comments' in b) {
    return (b.num_comments - a.num_comments) || (b.score - a.score)
  } if ('num_comments' in a) {
    return -1
  } else if ('num_comments' in b) {
    return 1
  } else {
    return (b.score - a.score)
  }
}
const items_byNumReplies = (a, b) => {
  if ('num_replies' in a && 'num_replies' in b) {
    return (b.num_replies - a.num_replies) || (b.created_utc - a.created_utc)
  } if ('num_replies' in a) {
    return -1
  } else if ('num_replies' in b) {
    return 1
  } else {
    return (b.created_utc - a.created_utc)
  }
}

const items_bySubredditSubscribers = (a, b) => {
  if ('subreddit_subscribers' in a && 'subreddit_subscribers' in b) {
    return (b.subreddit_subscribers - a.subreddit_subscribers) || (b.score - a.score)
  } if ('subreddit_subscribers' in a) {
    return -1
  } else if ('subreddit_subscribers' in b) {
    return 1
  } else {
    return (b.score - a.score)
  }
}
const items_byControversiality = (a, b) => {
  if ('num_comments' in a) {
    return  (a.score - b.score) || (b.num_comments - a.num_comments)
  } else {
    return  (a.score - b.score)
  }
}


const COMMENTS = 'c', POSTS = 'p', ITEMS = 'i'
const sortFnMap = {
  [COMMENTS]: {
    [localSort_types.date]: items_byDate,
    [localSort_types.date_observed]: comments_byDateObserved,
    [localSort_types.score]: items_byScore,
    [localSort_types.controversiality1]: comments_byControversiality1,
    [localSort_types.controversiality2]: comments_byControversiality2,
    [localSort_types.comment_length]: comments_byCommentLength,
    [localSort_types.num_comments]: items_byNumComments,
    [localSort_types.subreddit_subscribers]: items_bySubredditSubscribers,
  },
  [POSTS]: {
    [localSort_types.date]: posts_byDate,
    [localSort_types.num_comments]: posts_byNumComments,
    [localSort_types.score]: posts_byScore,
    [localSort_types.controversiality]: posts_byControversiality,
    [localSort_types.num_crossposts]: posts_byNumCrossposts,
  },
  [ITEMS]: {
    [localSort_types.date]: items_byDate,
    [localSort_types.score]: items_byScore,
    [localSort_types.controversiality]: items_byControversiality,
    [localSort_types.num_comments]: items_byNumComments,
    [localSort_types.num_crossposts]: posts_byNumCrossposts,
    [localSort_types.num_replies]: items_byNumReplies,
    [localSort_types.subreddit_subscribers]: items_bySubredditSubscribers,
  }
}
const page_type_map = {
  subreddit_posts: POSTS,
  subreddit_comments: COMMENTS,
  duplicate_posts: POSTS,
  domain_posts: POSTS,
  missing_comments: COMMENTS,
  search: ITEMS,
  info: ITEMS,
}

export const getSortFn = (page_type, localSort) => {
  if (page_type in page_type_map) {
    return sortFnMap[page_type_map[page_type]][localSort]
  }
}
