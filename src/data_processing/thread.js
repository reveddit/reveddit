import { combinePushshiftAndRedditComments, copyModlogItemsToArchiveItems } from 'data_processing/comments'
import { combineRedditAndPushshiftPost } from 'data_processing/posts'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread,
  getCommentsByID as getPushshiftComments
} from 'api/pushshift'
import {
  getComments as getRedditComments,
  getPostWithComments as getRedditPostWithComments,
  getModerators, getModlogsComments, getModlogsPosts
} from 'api/reddit'
import {
  submitMissingComments
} from 'api/reveddit'
import { itemIsRemovedOrDeleted, postIsDeleted, postIsRemoved, jumpToHash } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

const numCommentsWithPost = 500
let archiveError = false
const ignoreArchiveErrors = () => {
  archiveError = true
  return {}
}

export const getRevdditThreadItems = (threadID, commentID, context, global, history) => {
  global.setLoading('')
  let pushshift_comments_promise
  if (! commentID) {
    pushshift_comments_promise = getPushshiftCommentsByThread(threadID)
    .catch(ignoreArchiveErrors)
  }

  const reddit_pwc_promise = getRedditPostWithComments({threadID, commentID, context, sort: 'old', limit: numCommentsWithPost})
  .then(({post: reddit_post, comments: redditComments, moreComments, oldestComment}) => {
    const moderators_promise = getModerators(reddit_post.subreddit)
    const modlogs_comments_promise = getModlogsComments(reddit_post.subreddit, reddit_post.id)
    let modlogs_posts_promise = Promise.resolve({})
    if (postIsRemoved(reddit_post) && reddit_post.is_self) {
      modlogs_posts_promise = getModlogsPosts(reddit_post.subreddit)
    }
    document.title = reddit_post.title
    const resetPath = () => {
      history.replace(reddit_post.permalink+window.location.search+window.location.hash)
    }
    if ((window.location.pathname.match(/\//g) || []).length < 6) {
      resetPath()
    }
    const post_without_pushshift_data = combineRedditAndPushshiftPost(reddit_post, undefined)

    // comments/article lookup may return no comments if a comment is removed,
    // so, need to query the root comment separately so that pushshift comments
    // lookup can make use of its created_utc
    let oldest_comment_promise = Promise.resolve(oldestComment)
    if (! Object.keys(oldestComment).length && commentID) {
      oldest_comment_promise = getRedditComments({ids: [commentID]})
      .then(oldestComments => {
        oldestComment = oldestComments[commentID] || {}
        Object.assign(redditComments, oldestComments)
        return oldestComment
      })
    }
    return oldest_comment_promise.then(oldestComment => {
      let reddit_comments_promise = Promise.resolve({redditComments, moreComments})
      let root_commentID
      if (commentID) {
        root_commentID = oldestComment.id
        pushshift_comments_promise = getPushshiftCommentsByThread(threadID, oldestComment.created_utc - 1)
        .catch(ignoreArchiveErrors)
      }
      const combinedComments = combinePushshiftAndRedditComments({}, redditComments, false, post_without_pushshift_data)
      const commentTree = createCommentTree(threadID, root_commentID, combinedComments)
      return global.setState({threadPost: post_without_pushshift_data,
                              items: Object.values(combinedComments),
                              itemsLookup: combinedComments,
                              commentTree,
                              initialFocusCommentID: commentID})
      .then(() => {
        jumpToHash(window.location.hash)
        // Add 100 to threshhold b/c if post.num_comments <= numCommentsWithPost, first call could return
        // numCommentsWithPost and second call (sort by 'new') might return 50.
        // In that case you still need to call api/info, getting 100 items per request.
        // Needs more testing, setting numCommentsWithPost=500 seemed slower than 100
        if (reddit_post.num_comments > numCommentsWithPost+100 && ! commentID) {
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
        return {reddit_post, root_commentID, reddit_comments_promise, pushshift_comments_promise, resetPath,
                moderators_promise, modlogs_comments_promise, modlogs_posts_promise}
      })
    })
  })

  const pushshift_post_promise = getPushshiftPost(threadID)
  .catch(ignoreArchiveErrors)

  reddit_pwc_promise.then(({reddit_post, modlogs_posts_promise}) => {
    return modlogs_posts_promise.then(modlogsPosts => {
      return pushshift_post_promise.then(ps_post => {
        const combined_post = combineRedditAndPushshiftPost(reddit_post, ps_post)
        let modlog
        if (combined_post.id in modlogsPosts) {
          modlog = modlogsPosts[combined_post.id]
          combined_post.modlog = modlog
        }
        if (combined_post.removed && combined_post.is_self) {
          if (modlog) {
            combined_post.selftext = modlog.target_body
          } else {
            combined_post.selftext = ps_post.selftext
          }
        }
        global.setState({threadPost: combined_post})
        return combined_post
      })
    })
  })

  const combined_comments_promise = reddit_pwc_promise
  .then(({reddit_post, root_commentID, reddit_comments_promise, resetPath,
          moderators_promise, modlogs_comments_promise}) => {
    return reddit_comments_promise.then(({redditComments, moreComments}) => {
      return pushshift_comments_promise.then(pushshiftComments => {
        return modlogs_comments_promise.then(modlogsComments => {
          copyModlogItemsToArchiveItems(modlogsComments, pushshiftComments)
          if (! pushshiftComments[commentID] && ! redditComments[commentID]) {
            commentID = undefined
            root_commentID = undefined
            resetPath()
          }
          const origRedditComments = {...redditComments}
          const remainingRedditIDs = []
          Object.keys(pushshiftComments).forEach(id => {
            if (! (id in redditComments)) {
              remainingRedditIDs.push(id)
            }
          })
          let reddit_remaining_comments_promise = Promise.resolve([])
          if (remainingRedditIDs.length) {
            reddit_remaining_comments_promise = getRedditComments({ids: remainingRedditIDs})
          }
          const early_combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
          const early_commentTree = createCommentTree(threadID, root_commentID, early_combinedComments)

          return global.setState({items: Object.values(early_combinedComments),
                            itemsLookup: early_combinedComments,
                            commentTree: early_commentTree,
                  initialFocusCommentID: commentID})
          .then(() => {
            return reddit_remaining_comments_promise.then(remainingRedditComments => {
              return moderators_promise.then(moderators => {
                Object.values(remainingRedditComments).forEach(comment => {
                  redditComments[comment.id] = comment
                })
                const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
                //todo: check if pushshiftComments has any parent_ids that are not in combinedComments
                //      and do a reddit query for these. Possibly query twice if the result has items whose parent IDs
                //      are not in combinedComments after adding the result of the first query
                const commentTree = createCommentTree(threadID, root_commentID, combinedComments)
                const missing = []
                markTreeMeta(missing, origRedditComments, moreComments, commentTree, reddit_post.num_comments, root_commentID, commentID)
                if (missing.length) {
                  console.log('missing', missing.join(','))
                  submitMissingComments(missing)
                }
                return {combinedComments, commentTree, moderators}
              })
            })
          })
        })
      })
    })
  })
  return Promise.all([pushshift_post_promise,
                      combined_comments_promise])
  .then(result => {
    const {combinedComments, commentTree, moderators} = result[1]
    const stateObj = {items: Object.values(combinedComments),
                      itemsLookup: combinedComments,
                      commentTree, moderators}
    if (! archiveError) {
      return global.setSuccess(stateObj)
    } else {
      return global.setError('', stateObj)
    }
  })
}

export const insertParent = (child_id, global) => {
  let promise = Promise.resolve()
  let { items, itemsLookup, commentTree, threadPost } = global.state
  const child = itemsLookup[child_id]
  const [parent_kind, parent_id] = child.parent_id.split('_')
  if (! itemsLookup[parent_id] && parent_kind === 't1') {
    promise = global.setLoading('')
    .then(() => getRedditComments({ids: [parent_id]}))
    .then(redditComments => {
      const comment = redditComments[parent_id]
      if (comment) {
        let combined = combinePushshiftAndRedditComments({}, redditComments, false, threadPost)
        let ps_promise = Promise.resolve(combined)
        if (comment.removed) {
          ps_promise = getPushshiftComments([parent_id])
          .then(pushshiftComments => {
            if (pushshiftComments[parent_id]) {
              combined = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, threadPost)
            }
            return combined
          })
        }
        return ps_promise.then(combined => {
          const combinedComment = combined[parent_id]
          combinedComment.replies = [child]
          items.push(combinedComment)
          itemsLookup[parent_id] = combinedComment
          commentTree = [combinedComment]
          return global.setSuccess({items, itemsLookup, commentTree})
        })
      } else {
        return global.setError('')
      }
    })
  }
  return promise
}

const maxDepth = 9
const markTreeMeta = (missing, origRedditComments, moreComments, comments, post_numComments, root_commentID, focusCommentID, depth = 0) => {
  const now = Math.floor((new Date).getTime()/1000)
  comments.forEach(comment => {
    comment.depth = depth
    if (! origRedditComments[comment.id]
        && (origRedditComments[comment.parent_id.substr(3)] || (! root_commentID && comment.parent_id.slice(0,2) === 't3'))
        && (! focusCommentID || comment.ancestors[focusCommentID])
        && ! moreComments[comment.parent_id]
        && depth <= maxDepth && ! comment.removed && ! comment.deleted
        && (now - comment.created_utc) > 120) {
      missing.push(comment.id)
      comment.missing_in_thread = true
    }
    if (comment.replies.length && depth < maxDepth) {
      markTreeMeta(missing, origRedditComments, moreComments, comment.replies, post_numComments, root_commentID, focusCommentID, depth+1)
    }
  })
}

export const createCommentTree = (postID, root_commentID, comments) => {
    const commentTree = []
    Object.keys(comments)
      .sort((a,b) => comments[a].created_utc - comments[b].created_utc) // sort so ancestors are tracked properly
      .forEach(commentID => {
        const comment = comments[commentID]
        comment.replies = [], comment.ancestors = {}
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
