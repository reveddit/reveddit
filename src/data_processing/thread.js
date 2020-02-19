import { retrieveRedditComments_and_combineWithPushshiftComments,
         combinePushshiftAndRedditComments, createCommentTree } from 'data_processing/comments'
import { combineRedditAndPushshiftPost } from 'data_processing/posts'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread
} from 'api/pushshift'
import {
  getComments as getRedditComments,
  getPostWithComments as getRedditPostWithComments
} from 'api/reddit'
import { itemIsRemovedOrDeleted, postIsDeleted } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

const numCommentsWithPost = 100

export const getRevdditThreadItems = (threadID, global) => {
  global.setLoading('')
  const reddit_pwc_promise = getRedditPostWithComments(threadID, 'old', numCommentsWithPost)
  .then(({post, comments: redditComments_old}) => {
    let reddit_comments_promise = Promise.resolve(redditComments_old)
    // Add 100 to threshhold b/c if post.num_comments <= numCommentsWithPost, first call could return
    // numCommentsWithPost and second call (sort by 'new') might return 50.
    // In that case you still need to call api/info, getting 100 items per request.
    // Needs more testing, setting numCommentsWithPost=500 seemed slower than 100
    if (post.num_comments > numCommentsWithPost+100) {
      reddit_comments_promise = getRedditPostWithComments(threadID, 'new', numCommentsWithPost)
      .then(({comments: redditComments_new}) => {
        Object.keys(redditComments_new).forEach(id => {
          if (! redditComments_old[id]) {
            redditComments_old[id] = redditComments_new[id]
          }
        })
        return redditComments_old
      })
      return {post, reddit_comments_promise}
    }
    return {post, reddit_comments_promise}
  })

  const pushshift_post_promise = getPushshiftPost(threadID)
  const pushshift_comments_promise = getPushshiftCommentsByThread(threadID)

  reddit_pwc_promise.then(({post}) => {
    document.title = post.title
    if ((window.location.pathname.match(/\//g) || []).length < 6) {
      window.history.replaceState(null,null,post.permalink+window.location.search+window.location.hash)
    }
    const result = combineRedditAndPushshiftPost(post, undefined)
    global.setState({redditThreadPost: result})
  })

  Promise.all([reddit_pwc_promise, pushshift_post_promise])
  .then(([reddit_pwc_result, ps_post]) => {
    const reddit_post = reddit_pwc_result.post
    const post = combineRedditAndPushshiftPost(reddit_post, ps_post)
    if (post.removed && post.is_self) {
      post.selftext = ps_post.selftext
    }
    global.setState({threadPost: post})
    return post
  })

  const combined_comments_promise = Promise.all([reddit_pwc_promise, pushshift_comments_promise])
  .then(([{post, reddit_comments_promise}, pushshiftComments]) => {
    return reddit_comments_promise.then(redditComments => {
      const remainingRedditIDs = []
      Object.keys(pushshiftComments).forEach(ps_id => {
        if (! (ps_id in redditComments)) {
          remainingRedditIDs.push(ps_id)
        }
      })
      let reddit_remaining_comments_promise = Promise.resolve([])
      if (remainingRedditIDs.length) {
        reddit_remaining_comments_promise = getRedditComments(({ids: remainingRedditIDs}))
      }
      return reddit_remaining_comments_promise.then(remainingRedditComments => {
        Object.values(remainingRedditComments).forEach(comment => {
          redditComments[comment.id] = comment
        })
        const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, post)
        //todo: check if pushshiftComments has any parent_ids that are not in combinedComments
        //      and do a reddit query for these. Possibly query twice if the result has items whose parent IDs
        //      are not in combinedComments after adding the result of the first query
        const commentTree = createCommentTree(threadID, combinedComments)
        global.setState({items: Object.values(combinedComments),
                         itemsLookup: combinedComments,
                         commentTree})
        return combinedComments
      })
    })
  })
  return Promise.all([pushshift_post_promise,
                      combined_comments_promise])
  .then(result => {
    global.setSuccess({})
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
