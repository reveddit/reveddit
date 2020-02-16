import { retrieveRedditComments_and_combineWithPushshiftComments } from 'data_processing/comments'
import { combineRedditAndPushshiftPost } from 'data_processing/posts'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread
} from 'api/pushshift'
import {
  getItems
} from 'api/reddit'
import { itemIsRemovedOrDeleted, postIsDeleted } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

export const getRevdditThreadItems = (threadID, global) => {
  global.setLoading('')
  const promises = [getRevdditThreadPost(threadID, global),
                    getRevdditThreadComments(threadID, global)]
  return Promise.all(promises)
  .then(result => {
    const post = result[0]
    const comments = result[1]
    comments.forEach(comment => {
      if (comment.author === post.author) {
        comment.is_op = true
      }
    })
    global.setSuccess({items: comments})
  })
}

export const getRevdditThreadPost = (threadID, global) => {
  const reddit_promise = getItems(['t3_'+threadID])
  const pushshift_promise = getPushshiftPost(threadID)
  return Promise.all([reddit_promise, pushshift_promise])
  .then(values => {
    const reddit_post = values[0][0]
    const ps_post = values[1]
    document.title = reddit_post.title
    if ((window.location.pathname.match(/\//g) || []).length < 6) {
      window.history.replaceState(null,null,reddit_post.permalink+window.location.search)
    }
    const post = combineRedditAndPushshiftPost(reddit_post, ps_post)
    if (post.removed && post.is_self) {
      post.selftext = ps_post.selftext
    }
    global.setState({threadPost: post})
    return post
  })
}

export const getRevdditThreadComments = (threadID, global) => {
  return getPushshiftCommentsByThread(threadID)
  .then(pushshiftComments => {
    return retrieveRedditComments_and_combineWithPushshiftComments(pushshiftComments)
    .then(combinedComments => {
      return combinedComments
    })
  })
  .catch(global.setError)
}
