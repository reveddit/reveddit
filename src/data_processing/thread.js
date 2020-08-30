import { combinePushshiftAndRedditComments, copyModlogItemsToArchiveItems,
} from 'data_processing/comments'
import { combineRedditAndPushshiftPost } from 'data_processing/posts'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread,
  getCommentsByID as getPushshiftComments
} from 'api/pushshift'
import {
  getComments as getRedditComments,
  getPostWithComments as getRedditPostWithComments,
  getModerators, getModlogsComments, getModlogsPosts,
  queryUserPage,
} from 'api/reddit'
import { getAuth } from 'api/reddit/auth'
import {
  submitMissingComments
} from 'api/reveddit'
import { itemIsRemovedOrDeleted, postIsDeleted, postIsRemoved, jumpToHash,
         convertPathSub,
} from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import {AddUserParam, getUserCommentsForPost, addUserComments} from 'data_processing/FindCommentViaAuthors'

const numCommentsWithPost = 500
let archiveError = false
const ignoreArchiveErrors = () => {
  archiveError = true
  return {}
}

export const getRevdditThreadItems = async (threadID, commentID, context, add_user, user_kind, user_sort, user_time, before, after,
                                            global, history) => {
  let pushshift_comments_promise = Promise.resolve({})
  if (! commentID) {
    pushshift_comments_promise = getPushshiftCommentsByThread(threadID)
    .catch(ignoreArchiveErrors)
  }
  await getAuth()
  const add_user_promises = []
  if (add_user) {
    if (! add_user.match(/\./)) {
      //old format
      add_user_promises.push(queryUserPage(add_user, user_kind || '', user_sort, before, after, user_time, 1))
    } else {
      //new format
      const addUserItems = (new AddUserParam({string: add_user})).getItems().slice(0,10)
      for (const aui of addUserItems) {
        add_user_promises.push(aui.query())
      }
    }
  }
  let root_comment_promise = Promise.resolve({})
  if (commentID) {
    root_comment_promise = getRedditComments({ids: [commentID]})
  }
  const reddit_pwc_promise = getRedditPostWithComments({threadID, commentID, context, sort: 'old', limit: numCommentsWithPost})
  .then(async ({post: reddit_post, comments: redditComments, moreComments, oldestComment}) => {
    const moderators_promise = getModerators(reddit_post.subreddit)
    const modlogs_comments_promise = getModlogsComments(reddit_post.subreddit, reddit_post.id)
    let modlogs_posts_promise = Promise.resolve({})
    if (postIsRemoved(reddit_post) && reddit_post.is_self) {
      modlogs_posts_promise = getModlogsPosts(reddit_post.subreddit)
    }
    document.title = reddit_post.title
    const resetPath = () => {
      history.replace(convertPathSub(reddit_post.permalink)+window.location.search+window.location.hash)
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
    oldestComment = await oldest_comment_promise
    let reddit_comments_promise = Promise.resolve({redditComments, moreComments})
    let root_commentID
    if (commentID) {
      root_commentID = oldestComment.id
      pushshift_comments_promise = getPushshiftCommentsByThread(threadID, oldestComment.created_utc - 1)
      .catch(ignoreArchiveErrors)
    }
    const combinedComments = combinePushshiftAndRedditComments({}, redditComments, false, post_without_pushshift_data)
    const [commentTree, commentsSortedByDate] = createCommentTree(threadID, root_commentID, combinedComments)
    await global.setState({threadPost: post_without_pushshift_data,
                           items: Object.values(combinedComments),
                           itemsLookup: combinedComments,
                           commentTree, commentsSortedByDate,
                           initialFocusCommentID: commentID})
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

  const pushshift_post_promise = getPushshiftPost(threadID)
  .catch(ignoreArchiveErrors)

  reddit_pwc_promise.then(async ({reddit_post, modlogs_posts_promise}) => {
    const modlogsPosts = await modlogs_posts_promise
    const ps_post = await pushshift_post_promise
    const combined_post = combineRedditAndPushshiftPost(reddit_post, ps_post)
    let modlog
    if (combined_post.id in modlogsPosts) {
      modlog = modlogsPosts[combined_post.id]
      combined_post.modlog = modlog
    }
    if (combined_post.removed && combined_post.is_self) {
      if (modlog) {
        combined_post.selftext = modlog.target_body
      } else if (ps_post && ps_post.selftext) {
        combined_post.selftext = ps_post.selftext
      }
    }
    global.setState({threadPost: combined_post})
    return combined_post
  })

  const combined_comments_promise = reddit_pwc_promise
  .then(async ({reddit_post, root_commentID, reddit_comments_promise, resetPath,
          moderators_promise, modlogs_comments_promise}) => {
    const {redditComments, moreComments} = await reddit_comments_promise
    const pushshiftComments = await pushshift_comments_promise
    const modlogsComments = await modlogs_comments_promise
    const rootComment = await root_comment_promise
    if (rootComment && rootComment[commentID] && ! redditComments[commentID]) {
      redditComments[commentID] = rootComment[commentID]
    }
    copyModlogItemsToArchiveItems(modlogsComments, pushshiftComments)
    if (! pushshiftComments[commentID] && ! redditComments[commentID]) {
      commentID = undefined
      root_commentID = undefined
      resetPath()
    }
    const origRedditComments = {...redditComments}
    const early_combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
    const [early_commentTree, early_commentsSortedByDate] = createCommentTree(threadID, root_commentID, early_combinedComments)

    await global.setState({items: Object.values(early_combinedComments),
                      itemsLookup: early_combinedComments,
                      commentTree: early_commentTree,
                      commentsSortedByDate: early_commentsSortedByDate,
            initialFocusCommentID: commentID})
    const {user_comments, newIDs: remainingRedditIDs} = await Promise.all(add_user_promises).then(
      getUserCommentsForPost.bind(null, reddit_post.name, early_combinedComments)
    )
    Object.keys(pushshiftComments).forEach(id => {
      if (! (id in redditComments)) {
        remainingRedditIDs[id] = 1
      }
    })
    const remainingRedditIDs_arr = Object.keys(remainingRedditIDs)
    let reddit_remaining_comments_promise = Promise.resolve([])
    if (remainingRedditIDs_arr.length) {
      reddit_remaining_comments_promise = getRedditComments({ids: remainingRedditIDs_arr})
    }
    const remainingRedditComments = await reddit_remaining_comments_promise
    Object.values(remainingRedditComments).forEach(comment => {
      redditComments[comment.id] = comment
    })
    const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
    const insertUserComments = (user_comments, commentsLookup, threadID, root_commentID) => {

    }
    addUserComments(user_comments, combinedComments)
    //todo: check if pushshiftComments has any parent_ids that are not in combinedComments
    //      and do a reddit query for these. Possibly query twice if the result has items whose parent IDs
    //      are not in combinedComments after adding the result of the first query
    const [commentTree, commentsSortedByDate] = createCommentTree(threadID, root_commentID, combinedComments)
    const missing = []
    markTreeMeta(missing, origRedditComments, moreComments, commentTree, reddit_post.num_comments, root_commentID, commentID)
    if (missing.length) {
      console.log('missing', missing.join(','))
      submitMissingComments(missing)
    }
    const moderators = await moderators_promise
    return {combinedComments, commentTree, commentsSortedByDate, moderators, subreddit_lc: reddit_post.subreddit.toLowerCase()}
  })
  await pushshift_post_promise
  const {combinedComments, commentTree, commentsSortedByDate, moderators, subreddit_lc} = await combined_comments_promise
  const stateObj = {items: Object.values(combinedComments),
                    itemsLookup: combinedComments,
                    commentTree, commentsSortedByDate,
                    moderators: {[subreddit_lc]: moderators}}
  if (! archiveError) {
    return global.setSuccess(stateObj)
  } else {
    return global.setError('', stateObj)
  }
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
    const commentsSortedByDate = Object.values(comments).sort((a,b) => a.created_utc - b.created_utc)
    // use sorted comments so ancestors are tracked properly
    for (const [i, comment] of commentsSortedByDate.entries()) {
      comment.by_date_i = i
      comment.replies = [], comment.ancestors = {}
      const parentID = comment.parent_id
      const parentID_short = parentID.substr(3)
      if ((! root_commentID && parentID === 't3_'+postID) ||
           comment.id === root_commentID) {
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
    }
    return [commentTree, commentsSortedByDate]
}
