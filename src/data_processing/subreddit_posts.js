import {
  getRecentPostsBySubreddit
} from 'api/pushshift'
import { getRemovedPostIDs } from 'api/removeddit'
import { getPosts } from 'api/reddit'
import { postIsDeleted } from 'utils'
import { processPushshiftPosts } from 'data_processing/posts'

export const getRevdditPostsBySubreddit = (subreddit, global, history) => {
  const gs = global.state
  // /r/sub/new , /r/sub/controversial etc. are not implemented, so redirect
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    history.replace(`/r/${subreddit}/`+window.location.search)
  }
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
    .then(processPushshiftPosts)
    .then(show_posts => {
      global.setSuccess({items:show_posts})
      return show_posts
    })
  }
}
