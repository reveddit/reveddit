import { isCommentID, isPostID } from 'utils'
import {
  getItems as getRedditItemsByID
} from 'api/reddit'
import {
  getPostsByID as getPushshiftPosts,
  getCommentsByID as getPushshiftComments,
  queryComments as pushshiftQueryComments,
  queryPosts as pushshiftQueryPosts
} from 'api/pushshift'
import { combinePushshiftAndRedditComments, getRevdditComments } from 'data_processing/comments'
import { combinePushshiftAndRedditPosts, getRevdditPosts } from 'data_processing/posts'

export const byScore = (a, b) => {
  return (b.score - a.score)
}
export const byDate = (a, b) => {
  return (b.created_utc - a.created_utc)
}
export const byNumComments = (a, b) => {
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

export const byControversiality = (a, b) => {
  if ('num_comments' in a) {
    return  (a.score - b.score) || (b.num_comments - a.num_comments)
  } else {
    return  (a.score - b.score)
  }
}

export const getRevdditItems = (global, history) => {
  const gs = global.state
  global.setLoading('')
  const ids = decodeURI(gs.id).replace(/ /g,'').split(',')
  const postIDs = [], commentIDs = []
  ids.forEach(id => {
    if (isCommentID(id)) commentIDs.push(id.slice(3))
    else if (isPostID(id)) postIDs.push(id.slice(3))
  })

  // query PS twice, reddit in chunks, all at the same time
  const promises = [getRedditItemsByID(ids),
                    getPushshiftComments(commentIDs),
                    getPushshiftPosts(postIDs)]
  return Promise.all(promises)
  .then(result => {
    const redditItems = result[0]
    const pushshiftComments = result[1]
    const pushshiftPosts = result[2]
    const redditComments = []
    const redditPosts = []
    redditItems.forEach(item => {
      if (isCommentID(item.name)) redditComments.push(item)
      else if (isPostID(item.name)) redditPosts.push(item)
    })

    const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments)
    const combinedPosts = combinePushshiftAndRedditPosts(pushshiftPosts, redditPosts)
    global.setSuccess({items: combinedComments.concat(combinedPosts)})
  })
}

export const getRevdditSearch = (global, history) => {
  const {q, author, subreddit, n, before, after, domain, content} = global.state
  global.setLoading('')
  const promises = []
  if (content === 'comments' || content === 'all') {
    promises.push(pushshiftQueryComments({q, author, subreddit, n, before, after}))
  }
  if (content === 'posts' || content === 'all') {
    promises.push(pushshiftQueryPosts({q, author, subreddit, n, before, after}))
  }

  return Promise.all(promises)
  .then(results => {
    const nextPromises = []
    if (content === 'comments') {
      nextPromises.push(getRevdditComments(results[0]))
    } else if (content === 'posts') {
      nextPromises.push(getRevdditPosts(results[0]))
    } else if (content === 'all') {
      promises.push(getRevdditComments(results[0]))
      promises.push(getRevdditPosts(results[1]))
    }
    return Promise.all(nextPromises)
  })
  .then(results => {
    const items = []

    results.forEach(result => {
      items.push(...result)
    })
    global.setSuccess({items})
  })
}
