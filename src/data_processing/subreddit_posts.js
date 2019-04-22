import {
  getRecentPostsBySubreddit
} from 'api/pushshift'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED, USER_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import { getRemovedPostIDs } from 'api/removeddit'
import { getPosts, getItems } from 'api/reddit'
import { itemIsRemovedOrDeleted, postIsDeleted, display_post } from 'utils'

export const getRevdditPosts = (subreddit, global) => {
  const gs = global.state

  global.setLoading('Loading removed posts...')
  if (subreddit === 'all') {
    return getRemovedPostIDs(subreddit)
    .then(postIDs => getPosts(postIDs))
    .then(posts => {
      posts.forEach(post => {
        post.selftext = ''
        if (postIsDeleted(post)) {
          post.deleted = true
        } else {
          post.removed = true
        }
      })
      global.setSuccess({items: posts})
      return posts
    })
    .catch(global.setError)
  } else {
    return getRecentPostsBySubreddit(subreddit, gs.n, gs.before, gs.before_id)
    .then(posts_pushshift => {
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
                display_post(show_posts, post)
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
              display_post(show_posts, post)
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
        global.setSuccess({items:show_posts})
        return show_posts
      })
    })
  }
}
