import { getItems } from 'api/reddit'
import {
  getRecentPostsByDomain
} from 'api/pushshift'
import { itemIsRemovedOrDeleted, postIsDeleted, display_post } from 'utils'
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

export const processPushshiftPosts = posts_pushshift => {
  const ids = []
  const posts_pushshift_lookup = {}
  posts_pushshift.forEach(post => {
    ids.push(post.name)
    posts_pushshift_lookup[post.id] = post
  })

  return getItems(ids)
  .then(posts_reddit => {
    const show_posts = []
    posts_reddit.forEach(post => {
      post.selftext = ''
      const ps_item = posts_pushshift_lookup[post.id]
      const retrievalLatency = ps_item.retrieved_on-ps_item.created_utc
      if (itemIsRemovedOrDeleted(post)) {
        if (postIsDeleted(post)) {
          if (post.num_comments > 0) {
            post.deleted = true
            display_post(show_posts, post, ps_item)
          } else {
            // not showing deleted posts with 0 comments
          }
        } else {
          post.removed = true
          if (! ps_item.is_crosspostable) {
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
        if ('is_crosspostable' in ps_item && ! ps_item.is_crosspostable) {
          post.removedby = AUTOMOD_REMOVED_MOD_APPROVED
          //show_posts.push(post)
        } else {
          post.removedby = NOT_REMOVED
        }
        show_posts.push(post)
      }
    })
    return show_posts
  })
}

export const getRevdditPostsByDomain = (domain, global, history) => {
  const gs = global.state
  global.setLoading('')
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    history.replace(`/r/${domain}/`+window.location.search)
  }
  return getRecentPostsByDomain(domain, gs.n, gs.before, gs.before_id)
  .then(processPushshiftPosts)
  .then(show_posts => {
    global.setSuccess({items:show_posts})
    return show_posts
  })
}
