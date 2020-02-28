import { retrieveRedditComments_and_combineWithPushshiftComments,
         combinePushshiftAndRedditComments } from 'data_processing/comments'
import { combineRedditAndPushshiftPost } from 'data_processing/posts'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread
} from 'api/pushshift'
import {
  getComments as getRedditComments,
  getPostWithComments as getRedditPostWithComments
} from 'api/reddit'
import { itemIsRemovedOrDeleted, postIsDeleted, jumpToHash } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

const numCommentsWithPost = 500

export const getRevdditThreadItems = (threadID, commentID, context, global) => {
  global.setLoading('')
  let pushshift_comments_promise
  if (! commentID) {
    pushshift_comments_promise = getPushshiftCommentsByThread(threadID)
  }
  const reddit_pwc_promise = getRedditPostWithComments({threadID, commentID, context, sort: 'old', limit: numCommentsWithPost})
  .then(({post: reddit_post, comments: redditComments, moreComments, firstComment}) => {
    document.title = reddit_post.title
    if ((window.location.pathname.match(/\//g) || []).length < 6) {
      window.history.replaceState(null,null,reddit_post.permalink+window.location.search+window.location.hash)
    }
    const post_without_pushshift_data = combineRedditAndPushshiftPost(reddit_post, undefined)

    let reddit_comments_promise = Promise.resolve({redditComments, moreComments})
    let root_commentID
    if (commentID) {
      pushshift_comments_promise = getPushshiftCommentsByThread(threadID, firstComment.created_utc - 1)
      if (firstComment.id) {
        root_commentID = firstComment.id
      }
    }
    const combinedComments = combinePushshiftAndRedditComments({}, redditComments, false, post_without_pushshift_data)
    const commentTree = createCommentTree(threadID, root_commentID, combinedComments)
    return global.setState({threadPost: post_without_pushshift_data,
                            items: Object.values(combinedComments),
                            itemsLookup: combinedComments,
                            commentTree,
                            initialFocusCommentID: commentID})
    .then(res => {
      jumpToHash(window.location.hash)
      // Add 100 to threshhold b/c if post.num_comments <= numCommentsWithPost, first call could return
      // numCommentsWithPost and second call (sort by 'new') might return 50.
      // In that case you still need to call api/info, getting 100 items per request.
      // Needs more testing, setting numCommentsWithPost=500 seemed slower than 100
      if (reddit_post.num_comments > numCommentsWithPost+100) {
        reddit_comments_promise = getRedditPostWithComments({threadID, commentID, context, sort:'new', limit: numCommentsWithPost})
        .then(({comments: redditComments_new, moreComments: moreComments_new}) => {
          Object.keys(redditComments_new).forEach(id => {
            if (! redditComments[id]) {
              redditComments[id] = redditComments_new[id]
            }
          })
          Object.assign(moreComments, moreComments_new)
          return {redditComments, moreComments}
        })
      }
      return {reddit_post, root_commentID, reddit_comments_promise, pushshift_comments_promise}
    })
  })

  const pushshift_post_promise = getPushshiftPost(threadID)

  reddit_pwc_promise.then(({reddit_post}) => {
    return pushshift_post_promise.then(ps_post => {
      const combined_post = combineRedditAndPushshiftPost(reddit_post, ps_post)
      if (combined_post.removed && combined_post.is_self) {
        combined_post.selftext = ps_post.selftext
      }
      global.setState({threadPost: combined_post})
      return combined_post
    })
  })

  const combined_comments_promise = reddit_pwc_promise
  .then(({reddit_post, root_commentID, reddit_comments_promise}) => {
    return reddit_comments_promise.then(({redditComments, moreComments}) => {
      return pushshift_comments_promise.then(pushshiftComments => {
        const remainingRedditIDs = []
        const origRedditComments = {...redditComments}
        Object.keys(pushshiftComments).forEach(ps_id => {
          if (! (ps_id in redditComments)) {
            remainingRedditIDs.push(ps_id)
          }
        })
        let reddit_remaining_comments_promise = Promise.resolve([])
        if (remainingRedditIDs.length) {
          reddit_remaining_comments_promise = getRedditComments(({ids: remainingRedditIDs}))
        }
        const early_combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
        const early_commentTree = createCommentTree(threadID, root_commentID, early_combinedComments)

        return global.setState({items: Object.values(early_combinedComments),
                         itemsLookup: early_combinedComments,
                         commentTree: early_commentTree})
        .then(result => {
          return reddit_remaining_comments_promise.then(remainingRedditComments => {
            Object.values(remainingRedditComments).forEach(comment => {
              redditComments[comment.id] = comment
            })
            const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
            //todo: check if pushshiftComments has any parent_ids that are not in combinedComments
            //      and do a reddit query for these. Possibly query twice if the result has items whose parent IDs
            //      are not in combinedComments after adding the result of the first query
            const commentTree = createCommentTree(threadID, root_commentID, combinedComments)
            const missing = []
            markTreeMeta(missing, origRedditComments, moreComments, commentTree, reddit_post.num_comments, root_commentID)
            if (missing.length) {
              console.log('missing', missing.join(','))
            }
            return {combinedComments, commentTree}
          })
        })
      })
    })
  })
  return Promise.all([pushshift_post_promise,
                      combined_comments_promise])
  .then(result => {
    const {combinedComments, commentTree} = result[1]
    global.setSuccess({items: Object.values(combinedComments),
                       itemsLookup: combinedComments,
                       commentTree})
  })
}

const maxDepth = 9
const markTreeMeta = (missing, origRedditComments, moreComments, comments, post_numComments, root_commentID, depth = 0) => {
  comments.forEach(comment => {
    comment.depth = depth
    if (! origRedditComments[comment.id]
        && (origRedditComments[comment.parent_id.substr(3)] || (! root_commentID && comment.parent_id.slice(0,2) === 't3'))
        && ! moreComments[comment.parent_id]
        && depth <= maxDepth && ! comment.removed && ! comment.deleted) {
      missing.push(comment.name)
      comment.missing_in_thread = true
    }
    if (depth < maxDepth) {
      markTreeMeta(missing, origRedditComments, moreComments, comment.replies, post_numComments, root_commentID, depth+1)
    }
  })
}

const createCommentTree = (postID, root_commentID, comments) => {
    const commentTree = []
    Object.keys(comments)
      .sort((a,b) => comments[a].created_utc - comments[b].created_utc) // sort so ancestors are tracked properly
      .forEach(commentID => {
        const comment = comments[commentID]
        const parentID = comment.parent_id
        const parentID_short = parentID.substr(3)
        if ((! root_commentID && parentID === 't3_'+postID) ||
             commentID === root_commentID) {
          commentTree.push(comment)
        } else if (comments[parentID_short] === undefined && ! root_commentID) {
          // don't show error if root_commentID is defined b/c in that case
          // the pushshift query may return results that can't be shown
          console.error('MISSING PARENT ID:', parentID, 'for comment', comment)
        } else if (comments[parentID_short]) {
          comment.ancestors = {...comments[parentID_short].ancestors}
          comment.ancestors[parentID_short] = true
          comments[parentID_short].replies.push(comment)
        }
      })
    return commentTree
}
