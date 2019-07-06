import { combinePushshiftAndRedditComments } from 'data_processing/comments'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread
} from 'api/pushshift'
import {
  getPosts
} from 'api/reddit'
import { itemIsRemovedOrDeleted, postIsDeleted } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

export const getRevdditThreadItems = (threadID, global, history) => {
  global.setLoading('')
  const promises = [getRevdditThreadPost(threadID, global, history),
                    getRevdditThreadComments(threadID, global)]
  return Promise.all(promises)
  .then(result => {
    global.setSuccess()
  })
}

export const getRevdditThreadPost = (threadID, global, history) => {
  const reddit_promise = getPosts([threadID])
  const pushshift_promise = getPushshiftPost(threadID)
  return Promise.all([reddit_promise, pushshift_promise])
  .then(values => {
    const post = values[0][0]
    const ps_post = values[1]
    document.title = post.title
    if ((window.location.pathname.match(/\//g) || []).length < 6) {
      history.replace(post.permalink+window.location.search)
    }
    const retrievalLatency = ps_post.retrieved_on-ps_post.created_utc
    if (itemIsRemovedOrDeleted(post)) {
      if (postIsDeleted(post)) {
        post.deleted = true
        post.selftext = ''
      } else {
        post.removed = true
        if (post.is_self) {
          post.selftext = ps_post.selftext
        }
        if (! ps_post.is_crosspostable) {
          if (retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD) {
            post.removedby = AUTOMOD_REMOVED
          } else {
            post.removedby = UNKNOWN_REMOVED
          }
        } else {
          post.removedby = MOD_OR_AUTOMOD_REMOVED
        }
      }
    } else {
      // not-removed posts
      if ('is_crosspostable' in ps_post && ! ps_post.is_crosspostable) {
        post.removedby = AUTOMOD_REMOVED_MOD_APPROVED
      } else {
        post.removedby = NOT_REMOVED
      }
    }
    global.setState({threadPost: post})
    return post
  })
}

export const getRevdditThreadComments = (threadID, global) => {
  return getPushshiftCommentsByThread(threadID)
  .then(pushshiftComments => {
    return combinePushshiftAndRedditComments(pushshiftComments)
    .then(result => {
      global.setSuccess({items: pushshiftComments})
      return pushshiftComments
    })
  })
  .catch(global.setError)
}
