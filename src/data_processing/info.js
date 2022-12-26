import { isCommentID, isPostID, getUniqueItems,
         commentIsDeleted, commentIsRemoved,
         itemIsRemovedOrDeleted, postIsDeleted, sortCreatedAsc,
         authorDeleted,
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

export const getRevdditItems = (global) => {
  const gs = global.state
  const { quarantined_subreddits } = gs
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
  const reddit_promise = getRedditItems({ids, quarantined_subreddits})
  const pushshift_promises = [getPushshiftComments({ids: commentIDs}),
                              getPushshiftPosts({ids: postIDs})]
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
    return getPostDataForComments({link_ids_set, quarantined_subreddits})
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
          return combinePushshiftAndRedditPosts({
            pushshiftPosts: Object.values(pushshiftPosts),
            redditPosts,
            includePostsWithZeroComments: true,
            isInfoPage: true})
          .then(combinedPosts => {
            return global.returnSuccess({items: Object.values(combinedComments).concat(combinedPosts)})
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

const separateNotsFromIncludes = (allValues) => {
  const notValues = new Set(), posValues = new Set()
  allValues.toString().toLowerCase().split(',').forEach(value => {
    if (value) {
      if (value.startsWith('!')) {
        notValues.add(value.substr(1))
      } else {
        posValues.add(value)
      }
    }
  })
  return [notValues, posValues]
}

export const getRevdditSearch = (global) => {
  const {
    q, n, before, after, domain, or_domain,
    content, url, stickied, title, selftext, distinguished, sort_type,
    s_user_flair,
  } = global.state
  let {author, subreddit} = global.state
  const promises = []
  const [notAuthors, authors] = separateNotsFromIncludes(author)
  const [notSubreddits, subreddits] = separateNotsFromIncludes(subreddit)
  // if Pushshift re-enables negation, can remove or comment out the next two lines which overwrite author and subreddit
  author = Array.from(authors).join(',')
  subreddit = Array.from(subreddits).join(',')

  let include_comments = false
  const common_params = {
    author, user_flair: s_user_flair, subreddit, n, before, after, stickied,
    distinguished, sort_type,
  }
  if ((content === 'comments' || content === 'all') && ! url) {
    include_comments = true
    promises.push(pushshiftQueryComments({...common_params, q}))
  }
  if (content === 'posts' || content === 'all') {
    const common_post_params = {
      title, selftext, ...common_params,
    }
    promises.push(pushshiftQueryPosts({...common_post_params, q, domain, url }))
    if (or_domain) {
      promises.push(pushshiftQueryPosts({...common_post_params, domain: or_domain }))
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
      commentChildrenPromise = getPushshiftComments({ids: commentIDs, field: 'parent_id', fields: ['parent_id', 'id']})
    }
    return Promise.all(nextPromises)
  })
  .then(async results => {
    let childCounts = {}, oldestTimestamp, newestTimestamp
    if (commentChildrenPromise) {
      const commentChildren = await commentChildrenPromise
      childCounts = Object.values(commentChildren).reduce((acc, comment) => {
        acc[comment.parent_id] = (acc[comment.parent_id] || 0) + 1
        return acc
      }, {})
    }
    const allItems = [], items = []
    results.forEach(result => {
      allItems.push(...result)
    })
    allItems.sort(sortCreatedAsc).forEach(item => {
      if (! oldestTimestamp) {
        oldestTimestamp = item.created_utc
      }
      newestTimestamp = item.created_utc
      if (commentChildrenPromise) {
        if (isPostID(item.name)) {
          item.num_replies = item.num_comments
        } else if (item.name in childCounts) {
          item.num_replies = childCounts[item.name]
        }
      }
      const isComment = isCommentID(item.name)
      if (! notAuthors.has(item.author?.toLowerCase()) && ! notSubreddits.has(item.subreddit.toLowerCase())
          && (! authors.size || (isComment && ! commentIsDeleted(item)) || ! authorDeleted(item))
          && (! q || ! item.deleted || (! isComment && ! item.is_self))) {
        items.push(item)
      }
    })
    return global.returnSuccess({items, itemsSortedByDate: items, oldestTimestamp, newestTimestamp})
  })
}
