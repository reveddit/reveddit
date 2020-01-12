import { getItems } from 'api/reddit'
import {
  getPostsBySubredditOrDomain as pushshiftGetPostsBySubredditOrDomain,
  queryPosts as pushshiftQueryPosts
} from 'api/pushshift'
import { itemIsRemovedOrDeleted, postIsDeleted, display_post,
         getUniqueItems
} from 'utils'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED, USER_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

export const byScore = (a, b) => {
  return (b.stickied - a.stickied) || (b.score - a.score)
      || (b.num_comments - a.num_comments)
}
export const byDate = (a, b) => {
  return (b.stickied - a.stickied) || (b.created_utc - a.created_utc)
      || (b.num_comments - a.num_comments)
}
export const byNumComments = (a, b) => {
  return (b.stickied - a.stickied) || (b.num_comments - a.num_comments)
      || (b.created_utc - a.created_utc)
}
export const byControversiality = (a, b) => {
  return (b.stickied - a.stickied) || (a.score - b.score)
      || (b.num_comments - a.num_comments)
}
export const byNumCrossposts = (a, b) => {
  return (b.num_crossposts - a.num_crossposts) || (b.num_comments - a.num_comments)
      || (b.created_utc - a.created_utc)
}

export const retrieveRedditPosts_and_combineWithPushshiftPosts = (pushshiftPosts, includePostsWithZeroComments = false) => {
  const ids = pushshiftPosts.map(post => post.name)
  return getItems(ids)
  .then(redditPosts => {
    return combinePushshiftAndRedditPosts(pushshiftPosts, redditPosts, includePostsWithZeroComments)
  })
}

export const getRevdditPosts = (pushshiftPosts) => {
  return retrieveRedditPosts_and_combineWithPushshiftPosts(pushshiftPosts)
}

export const combinePushshiftAndRedditPosts = (pushshiftPosts, redditPosts, includePostsWithZeroComments = false) => {
  const redditPosts_lookup = {}
  redditPosts.forEach(post => {
    redditPosts_lookup[post.id] = post
  })
  const pushshiftPosts_lookup = {}
  const missingPosts = []
  pushshiftPosts.forEach(post => {
    pushshiftPosts_lookup[post.id] = post
    if (! redditPosts_lookup[post.id]) {
      missingPosts.push(post.id)
    }
  })
  if (missingPosts.length) {
    console.log('missing posts: '+missingPosts.join(' '))
  }
  const show_posts = []
  redditPosts.forEach(post => {
    post.selftext = ''
    const ps_item = pushshiftPosts_lookup[post.id]
    const retrievalLatency = ps_item.retrieved_on-ps_item.created_utc
    if (post.crosspost_parent_list) {
      post.num_crossposts += post.crosspost_parent_list.reduce((total,x) => total+x.num_crossposts,0)
    }
    if (itemIsRemovedOrDeleted(post)) {
      if (postIsDeleted(post)) {
        if (post.num_comments > 0 || includePostsWithZeroComments) {
          post.deleted = true
          display_post(show_posts, post, ps_item)
        } else {
          // not showing deleted posts with 0 comments
        }
      } else {
        post.removed = true
        if ('is_robot_indexable' in ps_item && ! ps_item.is_robot_indexable) {
          if (retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD) {
            post.removedby = AUTOMOD_REMOVED
          } else {
            post.removedby = UNKNOWN_REMOVED
          }
        } else {
          post.removedby = MOD_OR_AUTOMOD_REMOVED
        }
        display_post(show_posts, post, ps_item)
      }
    } else {
      // not-removed posts
      if ('is_robot_indexable' in ps_item && ! ps_item.is_robot_indexable) {
        post.removedby = AUTOMOD_REMOVED_MOD_APPROVED
        //show_posts.push(post)
      } else {
        post.removedby = NOT_REMOVED
      }
      show_posts.push(post)
    }
  })
  return show_posts
}

export const getRevdditPostsByDomain = (domain, global) => {
  const {n, before, before_id} = global.state
  global.setLoading('')
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    window.history.replaceState(null,null,`/r/${domain}/`+window.location.search)
  }
  return pushshiftGetPostsBySubredditOrDomain({domain, n, before, before_id})
  .then(retrieveRedditPosts_and_combineWithPushshiftPosts)
  .then(show_posts => {
    global.setSuccess({items:show_posts})
    return show_posts
  })
}

export const getRevdditDuplicatePosts = (threadID, global) => {
  global.setLoading('')
  return getItems(['t3_'+threadID])
  .then(redditPosts => {
    const drivingPost = redditPosts[0]
    let url = drivingPost.url
    let redditlikeDomainStripped = drivingPost.url.replace(/^https?:\/\/[^/]*(reddit\.com|removeddit\.com|ceddit\.com|unreddit\.com|snew\.github\.io|snew\.notabug\.io|politicbot\.github\.io|r\.go1dfish\.me|reve?ddit\.com)/,'')
    const isNonRedditDomain = ! redditlikeDomainStripped.match(/^\//)
    let isRedditPostURL = false
    if (redditlikeDomainStripped.match(/^\/r\/[^/]*\/comments\/[a-z0-9]/i)) {
      isRedditPostURL = true
      url = redditlikeDomainStripped.split('/').slice(0,5).join('/')
    }
    const promises = [pushshiftQueryPosts({url})]
    if (isNonRedditDomain || isRedditPostURL) {
      promises.push(pushshiftQueryPosts({selftext:'"'+url+'"'}))
    }
    return Promise.all(promises)
    .then(results => {
      if (results.length === 1) {
        return results[0]
      } else {
        return getUniqueItems(results[0], results[1])
      }
    })
    .then((pushshiftPosts) => retrieveRedditPosts_and_combineWithPushshiftPosts(pushshiftPosts, true))
    .then(items => {
      global.setSuccess({items})
      return items
    })
  })
}
