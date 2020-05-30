import {
  getPostsBySubredditOrDomain as pushshiftGetPostsBySubredditOrDomain
} from 'api/pushshift'
import { getRemovedPostIDs } from 'api/removeddit'
import { getPosts as getRedditPosts,
         getModerators, getSubredditAbout, getModlogsPosts
} from 'api/reddit'
import { postIsDeleted } from 'utils'
import { retrieveRedditPosts_and_combineWithPushshiftPosts } from 'data_processing/posts'

export const getRevdditPostsBySubreddit = (subreddit, global) => {
  const {n, before, before_id, frontPage} = global.state
  // /r/sub/new , /r/sub/controversial etc. are not implemented, so redirect
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    window.history.replaceState(null,null,`/r/${subreddit}/`+window.location.search)
  }
  global.setLoading('')
  if (subreddit === 'all') {
    return getRemovedPostIDs(subreddit)
    .then(ids => getRedditPosts({ids}))
    .then(posts => {
      const posts_array = Object.values(posts)
      posts_array.forEach(post => {
        post.selftext = ''
        if (postIsDeleted(post)) {
          post.deleted = true
        } else {
          post.removed = true
        }
      })
      global.setSuccess({items: posts_array})
      return posts
    })
    .catch(global.setError)
  } else {
    if (frontPage) {
      global.selection_update('frontPage', false, '')
    }
    const subreddit_lc = subreddit.toLowerCase()
    const moderators_promise = getModerators(subreddit)
    const subreddit_about_promise = getSubredditAbout(subreddit)
    const modlogs_posts_promise = getModlogsPosts(subreddit)
    return pushshiftGetPostsBySubredditOrDomain({subreddit, n, before, before_id})
    .catch(error => {return []}) // if ps is down, can still return modlog results
    .then(pushshiftPosts => {
      return modlogs_posts_promise.then(modlogsPosts => {
        return retrieveRedditPosts_and_combineWithPushshiftPosts({pushshiftPosts, subreddit_about_promise, modlogsPosts})
      })
    })
    .then(show_posts => {
      return moderators_promise.then(moderators => {
        global.setSuccess({items:show_posts, moderators: {[subreddit_lc]: moderators}})
        return show_posts
      })
    })
  }
}
