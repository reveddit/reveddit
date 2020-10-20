import { isCommentID, isPostID, getUniqueItems,
         commentIsDeleted, commentIsRemoved,
         itemIsRemovedOrDeleted, postIsDeleted
} from 'utils'
import { getPostsByURL } from './posts'
import {
  getItems as getRedditItems
} from 'api/reddit'
import {
  getPostsByID as getPushshiftPosts,
  getCommentsByID as getPushshiftComments,
  queryComments as pushshiftQueryComments,
  queryPosts as pushshiftQueryPosts
} from 'api/pushshift'
import { combinePushshiftAndRedditComments, getRevdditComments,
         getPostDataForComments, applyPostAndParentDataToComment
} from 'data_processing/comments'
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
export const byNumReplies = (a, b) => {
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

export const bySubredditSubscribers = (a, b) => {
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
export const byControversiality = (a, b) => {
  if ('num_comments' in a) {
    return  (a.score - b.score) || (b.num_comments - a.num_comments)
  } else {
    return  (a.score - b.score)
  }
}

export const getRevdditItems = (global) => {
  const gs = global.state
  if (gs.url && gs.url.split('.').length > 1) {
    const url = decodeURI(gs.url)
    return getPostsByURL(global, url)
  }
  const ids = gs.id ? decodeURI(gs.id).replace(/ /g,'').split(',') : []
  const postIDs = [], commentIDs = []
  ids.forEach(id => {
    if (isCommentID(id)) commentIDs.push(id.slice(3))
    else if (isPostID(id)) postIDs.push(id.slice(3))
  })
  // query PS twice, reddit in chunks, all at the same time
  const reddit_promise = getRedditItems(ids)
  const pushshift_promises = [getPushshiftComments(commentIDs),
                              getPushshiftPosts(postIDs)]
  return reddit_promise
  .then(redditItems => {
    const redditComments = {}
    const redditPosts = []
    const link_ids_set = {}
    const redditItemsArray = Object.values(redditItems)
    redditItemsArray.forEach(item => {
      item.link_title = item.permalink.split('/')[5].replace(/_/g, ' ')
      item.link_permalink = item.permalink.split('/').slice(0,6).join('/')+'/'
      if (isCommentID(item.name)) {
        redditComments[item.id] = item
        link_ids_set[item.link_id] = true
        if (commentIsRemoved(item)) {
          item.removed = true
        } else if (commentIsDeleted(item)) {
          item.deleted = true
        }
      } else if (isPostID(item.name)){
        item.selftext = ''
        redditPosts.push(item)
        if (itemIsRemovedOrDeleted(item)) {
          if (postIsDeleted(item)) {
            item.deleted = true
          } else {
            item.removed = true
          }
        }
      }
    })
    global.setState({items: redditItemsArray})
    return getPostDataForComments({link_ids_set})
    .then(postData => {
      setPostAndParentDataForComments(Object.values(redditComments), postData)
      return global.setState({items: redditItemsArray})
      .then(result => {
        return Promise.all(pushshift_promises)
        .then(result => {
          const pushshiftComments = result[0]
          const pushshiftPosts = result[1]
          const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false)
          // have to set post data 2x, after reddit data retrieval and after pushshift retrieval,
          // b/c a reddit comment may have author=[deleted] and setting is_op for a
          // removed comment depends on author info from pushshift
          setPostAndParentDataForComments(Object.values(combinedComments), postData)
          combinePushshiftAndRedditPosts({
            pushshiftPosts,
            redditPosts,
            includePostsWithZeroComments: true,
            isInfoPage: true})
          .then(combinedPosts => {
            global.setSuccess({items: Object.values(combinedComments).concat(combinedPosts)})
          })
        })
      })
    })
  })
}

export const setPostAndParentDataForComments = (comments, postData) => {
  comments.forEach(comment => {
    if (postData && comment.link_id in postData) {
      applyPostAndParentDataToComment(postData, comment)
    }
  })
}

export const getRevdditSearch = (global) => {
  const {q, author, subreddit, n, before, after, domain, or_domain, content, url, stickied, title, selftext} = global.state
  const promises = []
  const notAuthors = author.split(',').filter(x => x.match(/^!/)).reduce((map, obj) => (map[obj.substr(1)] = 1, map), {});
  let include_comments = false
  if ((content === 'comments' || content === 'all') && ! url) {
    include_comments = true
    promises.push(pushshiftQueryComments({q, author, subreddit, n, before, after, stickied}))
  }
  if (content === 'posts' || content === 'all') {
    promises.push(pushshiftQueryPosts({q, author, subreddit, n, before, after, domain, url, stickied, title, selftext}))
    if (or_domain) {
      promises.push(pushshiftQueryPosts({domain: or_domain, author, subreddit, n, before, after, stickied, title, selftext}))
    }
  }
  let commentChildrenPromise = undefined
  return Promise.all(promises)
  .then(results => {
    const nextPromises = []
    if (content === 'comments') {
      nextPromises.push(getRevdditComments({pushshiftComments: results[0]}))
    } else if (content === 'posts') {
      let posts = results[0]
      if (or_domain) {
        posts = getUniqueItems([results[0], results[1]])
      }
      nextPromises.push(getRevdditPosts(posts))
    } else if (content === 'all') {
      let posts = results[0]
      if (include_comments) {
        posts = results[1]
        nextPromises.push(getRevdditComments({pushshiftComments: results[0]}))
      }
      if (or_domain) {
        posts = getUniqueItems([results[1], results[2]])
      }
      nextPromises.push(getRevdditPosts(posts))
    }
    if (include_comments) {
      const commentIDs = Object.keys(results[0])
      commentChildrenPromise = getPushshiftComments(commentIDs, 'parent_id', ['parent_id', 'id'])
    }
    return Promise.all(nextPromises)
  })
  .then(async results => {
    let childCounts = {}
    if (commentChildrenPromise) {
      const commentChildren = await commentChildrenPromise
      childCounts = Object.values(commentChildren).reduce((acc, comment) => {
        acc[comment.parent_id] = (acc[comment.parent_id] || 0) + 1
        return acc
      }, {})
    }
    let items = []
    results.forEach(result => {
      items.push(...result)
    })
    if (Object.keys(notAuthors).length || commentChildrenPromise) {
      const newItems = []
      items.forEach(item => {
        if (commentChildrenPromise) {
          if (isPostID(item.name)) {
            item.num_replies = item.num_comments
          } else if (item.name in childCounts) {
            item.num_replies = childCounts[item.name]
          }
        }
        if (! notAuthors[item.author]) {
          newItems.push(item)
        }
      })
      items = newItems
    }
    items.sort((a,b) => a.created_utc - b.created_utc)
    global.setSuccess({items, itemsSortedByDate: items})
  })
}
