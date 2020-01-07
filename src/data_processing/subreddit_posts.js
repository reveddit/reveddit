import {
  getPostsBySubredditOrDomain as pushshiftGetPostsBySubredditOrDomain
} from 'api/pushshift'
import { getRemovedPostIDs } from 'api/removeddit'
import { getItems } from 'api/reddit'
import { postIsDeleted } from 'utils'
import { retrieveRedditPosts_and_combineWithPushshiftPosts } from 'data_processing/posts'

export const getRevdditPostsBySubreddit = (subreddit, global) => {
  const {n, before, before_id, frontPage} = global.state
  // /r/sub/new , /r/sub/controversial etc. are not implemented, so redirect
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    window.history.replaceState(null,null,`/r/${subreddit}/`+window.location.search)
  }
  global.setLoading('')
  if (subreddit === 'all' || frontPage) {
    return getRemovedPostIDs(subreddit)
    .then(postIDs => getItems(postIDs.map(id => 't3_'+id)))
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
    return pushshiftGetPostsBySubredditOrDomain({subreddit, n, before, before_id})
    .then(retrieveRedditPosts_and_combineWithPushshiftPosts)
    .then(show_posts => {
      global.setSuccess({items:show_posts})
      return show_posts
    })
  }
}
