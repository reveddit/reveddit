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
  submitMissingComments, getUmodlogsThread
} from 'api/reveddit'
import { itemIsRemovedOrDeleted, postIsDeleted, postIsRemoved, jumpToHash,
         convertPathSub, sortCreatedAsc, validAuthor, commentIsRemoved,
} from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import {AddUserParam, AddUserItem, getUserCommentsForPost,
        addUserComments, addUserComments_and_updateURL,
} from 'data_processing/FindCommentViaAuthors'

const numCommentsWithPost = 500
let archiveError = false
const ignoreArchiveErrors = () => {
  archiveError = true
  return {}
}
let useProxy = false

export const getRevdditThreadItems = async (threadID, commentID, context, add_user, user_kind, user_sort, user_time,
                                            before, after, subreddit,
                                            global) => {
  let pushshift_comments_promise = Promise.resolve({})
  if (! commentID) {
    pushshift_comments_promise = getPushshiftCommentsByThread(threadID)
    .catch(ignoreArchiveErrors)
  }
  await getAuth()
  const add_user_promises = []
  const add_user_authors = {}
  if (add_user) {
    if (! add_user.match(/\./)) {
      //old format
      add_user_promises.push(queryUserPage(add_user, user_kind || '', user_sort, before, after, user_time, 1))
    } else {
      //new format
      const addUserItems = (new AddUserParam({string: add_user})).getItems().slice(0,10)
      for (const aui of addUserItems) {
        add_user_promises.push(aui.query())
        add_user_authors[aui.author] = 1
      }
    }
  }
  let root_comment_promise = Promise.resolve({})
  let pushshift_post_promise = Promise.resolve(undefined)
  if (commentID) {
    root_comment_promise = getRedditComments({ids: [commentID]})
  }
  const uModlogs_promise = getUmodlogsThread(subreddit, threadID)
  const reddit_pwc_baseArgs = {threadID, commentID, context, limit: numCommentsWithPost}
  const reddit_pwc_baseArgs_firstQuery = {...reddit_pwc_baseArgs, sort: 'old'}
  const reddit_pwc_promise = getRedditPostWithComments(reddit_pwc_baseArgs_firstQuery)
  .catch(e => {
    if (e.message === 'Forbidden') {
      useProxy = true
      return getRedditPostWithComments({...reddit_pwc_baseArgs_firstQuery, useProxy})
    }
    throw new Error('unable to retrieve data from reddit')
  })
  .then(async ({post: reddit_post, comments: redditComments, moreComments, oldestComment}) => {
    const moderators_promise = getModerators(reddit_post.subreddit, useProxy)
    const modlogs_comments_promise = getModlogsComments({subreddit: reddit_post.subreddit, link_id: reddit_post.id, limit: 500})
    let modlogs_posts_promise = Promise.resolve({})
    if (postIsRemoved(reddit_post) && (reddit_post.is_self || reddit_post.is_gallery)) {
      pushshift_post_promise = getPushshiftPost(threadID).catch(ignoreArchiveErrors)
      modlogs_posts_promise = getModlogsPosts({subreddit: reddit_post.subreddit, link_id: reddit_post.id})
    }
    document.title = reddit_post.title
    const resetPath = (commentID) => {
      const commentPath = commentID ? commentID + '/' : ''
      window.history.replaceState(null,null,convertPathSub(reddit_post.permalink)+commentPath+window.location.search+window.location.hash)
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
      oldest_comment_promise = getRedditComments({ids: [commentID], useProxy})
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
    const [commentTree, itemsSortedByDate] = createCommentTree(threadID, root_commentID, combinedComments)
    await global.setState({threadPost: post_without_pushshift_data,
                           items: itemsSortedByDate, itemsSortedByDate,
                           itemsLookup: combinedComments,
                           commentTree,
                           initialFocusCommentID: commentID})
    jumpToHash(window.location.hash)
    // Add 100 to threshhold b/c if post.num_comments <= numCommentsWithPost, first call could return
    // numCommentsWithPost and second call (sort by 'new') might return 50.
    // In that case you still need to call api/info, getting 100 items per request.
    // Needs more testing, setting numCommentsWithPost=500 seemed slower than 100
    if (reddit_post.num_comments > numCommentsWithPost+100 && ! commentID) {
      reddit_comments_promise = getRedditPostWithComments({...reddit_pwc_baseArgs, sort:'new', useProxy})
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

  reddit_pwc_promise.then(async ({reddit_post, modlogs_posts_promise}) => {
    const modlogsPosts = await modlogs_posts_promise
    const ps_post = await pushshift_post_promise
    const uModlogsItems = await uModlogs_promise
    const uModlogsPost = uModlogsItems.posts[threadID]
    const combined_post = combineRedditAndPushshiftPost(reddit_post, ps_post)
    let modlog
    if (combined_post.id in modlogsPosts || uModlogsPost) {
      modlog = modlogsPosts[combined_post.id] || uModlogsPost
      combined_post.modlog = modlog
    }
    if (combined_post.removed && combined_post.is_self) {
      if (modlog) {
        combined_post.selftext = modlog.target_body
      } else if (uModlogsPost) {
        combined_post.selftext = uModlogsPost.target_body
      } else if (ps_post && 'selftext' in ps_post) {
        combined_post.selftext = ps_post.selftext
      }
    }
    return global.setState({threadPost: combined_post})
    .then(() => combined_post)
  })
  const combined_comments_promise = reddit_pwc_promise
  .then(async ({reddit_post, root_commentID, reddit_comments_promise, resetPath,
          moderators_promise, modlogs_comments_promise}) => {
    const {redditComments, moreComments} = await reddit_comments_promise
    const pushshiftComments = await pushshift_comments_promise
    const modlogsComments = await modlogs_comments_promise
    const uModlogsItems = await uModlogs_promise
    const rootComment = await root_comment_promise
    if (rootComment && rootComment[commentID] && ! redditComments[commentID]) {
      redditComments[commentID] = rootComment[commentID]
    }
    copyModlogItemsToArchiveItems(modlogsComments, pushshiftComments)
    //copy uModlogs items last b/c:
    // 1. these will overwrite any previous modlogs items
    // 2. the content will probably be retrievable in the future, since lookup method is by link ID.
    //    And, when log_source == u_modlogs, then 'temporarily visible' label is not shown
    copyModlogItemsToArchiveItems(uModlogsItems.comments, pushshiftComments)
    const focusComment_pushshift = pushshiftComments[commentID]
    const focusComment_reddit = redditComments[commentID]
    let new_add_user
    const add_user_promises_forURL = []
    if (! focusComment_pushshift && ! focusComment_reddit) {
      commentID = undefined
      root_commentID = undefined
      resetPath()
    } else {
      resetPath(commentID)
      if (focusComment_pushshift) {
        const focusCommentAuthor = focusComment_pushshift.author
        if (focusComment_reddit &&
          commentIsRemoved(focusComment_reddit) &&
          validAuthor(focusCommentAuthor) && ! add_user_authors[focusCommentAuthor]) {
          //if the focus comment is removed, and the author does not appear in the add_user parameter,
          //check for edits on the author's user page. Any edits will cause the URL to update
          const aui = new AddUserItem({author: focusCommentAuthor})
          add_user_promises_forURL.push(aui.query())
        }
      }
    }
    const origRedditComments = {...redditComments}
    const early_combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
    const [early_commentTree, early_itemsSortedByDate] = createCommentTree(threadID, root_commentID, early_combinedComments)
    await global.setState({items: early_itemsSortedByDate,
               itemsSortedByDate: early_itemsSortedByDate,
                      itemsLookup: early_combinedComments,
                      commentTree: early_commentTree,
            initialFocusCommentID: commentID})
    const pass_userPages_to_getUserCommentsForPost = (userPages) => getUserCommentsForPost(reddit_post, early_combinedComments, userPages)
    const {user_comments, newComments: remainingRedditIDs} = await Promise.all(add_user_promises)
      .then(pass_userPages_to_getUserCommentsForPost)
    const {user_comments: user_comments_forURL, newComments: remainingRedditIDs_2} = await Promise.all(add_user_promises_forURL)
      .then(pass_userPages_to_getUserCommentsForPost)
    Object.assign(remainingRedditIDs, remainingRedditIDs_2)
    Object.keys(pushshiftComments).forEach(id => {
      if (! (id in redditComments)) {
        remainingRedditIDs[id] = 1
      }
    })
    const remainingRedditIDs_arr = Object.keys(remainingRedditIDs)
    let reddit_remaining_comments_promise = Promise.resolve([])
    if (remainingRedditIDs_arr.length) {
      reddit_remaining_comments_promise = getRedditComments({ids: remainingRedditIDs_arr, useProxy})
    }
    const remainingRedditComments = await reddit_remaining_comments_promise
    Object.values(remainingRedditComments).forEach(comment => {
      redditComments[comment.id] = comment
    })
    // consider: change this logic to update combinedComments incrementally rather than recreating it from scratch
    // currently, combinePushshiftAndRedditComments() is called 3x:
    //     once with only reddit comments
    //     once with all Pushshift comments and some reddit comments
    //     once with all Pushshift comments and remaining reddit comments
    // The third call, here, could simply update based on the remainingRedditComments
    // To do that, would need to use early_combinedComments as the basis for a return value
    const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
    const {changed} = addUserComments(user_comments, combinedComments)
    new_add_user = addUserComments_and_updateURL(user_comments_forURL, combinedComments, add_user)
    //todo: check if pushshiftComments has any parent_ids that are not in combinedComments
    //      and do a reddit query for these. Possibly query twice if the result has items whose parent IDs
    //      are not in combinedComments after adding the result of the first query
    const [commentTree, itemsSortedByDate] = createCommentTree(threadID, root_commentID, combinedComments, true)
    const missing = []
    markTreeMeta(missing, origRedditComments, moreComments, commentTree, reddit_post.num_comments, root_commentID, commentID)
    if (missing.length) {
      submitMissingComments(missing)
    }
    const moderators = await moderators_promise
    return {combinedComments, commentTree, itemsSortedByDate, moderators,
            subreddit_lc: reddit_post.subreddit.toLowerCase(),
            new_add_user, add_user_on_page_load: changed.length,
           }
  })
  const {combinedComments, commentTree, itemsSortedByDate,
         moderators, subreddit_lc, new_add_user, add_user_on_page_load} = await combined_comments_promise
  const stateObj = {items: itemsSortedByDate,
                    itemsLookup: combinedComments,
                    commentTree, itemsSortedByDate,
                    moderators: {[subreddit_lc]: moderators},
                    add_user: new_add_user || add_user,
                    add_user_on_page_load,
                   }
  //set success/failure after everything from the archive is returned,
  //pushshift_post_promise will time out, and it only sends a request for self posts, so it's okay to wait for this non-critical request
  return Promise.all([pushshift_post_promise, combined_comments_promise])
  .then(() => {
    if (! archiveError) {
      return global.returnSuccess(stateObj)
    } else {
      return global.returnError(stateObj)
    }
  })
}

export const insertParent = (child_id, global) => {
  let promise = Promise.resolve()
  let { items, itemsLookup, commentTree, threadPost } = global.state
  const child = itemsLookup[child_id]
  const [parent_kind, parent_id] = child.parent_id.split('_')
  const parent = itemsLookup[parent_id]
  if (! parent && parent_kind === 't1') {
    promise = getRedditComments({ids: [parent_id], useProxy})
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
          combinedComment.ancestors = {}
          addAncestor(child, parent_id)
          items.push(combinedComment)
          itemsLookup[parent_id] = combinedComment
          commentTree = [combinedComment]
          return global.setSuccess({items, itemsLookup, commentTree})
        })
      } else {
        return global.setError()
      }
    })
  } else if (parent && ! parent.replies?.length) {
    //need this condition b/c when add_user is set on page load,
    //and top comment's context is clicked, the new ancestors might load w/out children
    //because although the current add_user logic does recreate the comment tree when adding new comments,
    //some 'inserted' comments might not connect until insertParent() runs a few times from successive clicks
    parent.replies.push(child)
    addAncestor(child, parent_id)
    commentTree = [parent]
    return global.setSuccess({commentTree})
  } else if (parent) {
    addAncestor(child, parent_id)
    commentTree = [parent]
    return global.setSuccess({commentTree})
  }
  return promise
}

const addAncestor = (descendant, ancestor_id) => {
  descendant.ancestors[ancestor_id] = true
  for (const reply of descendant.replies) {
    addAncestor(reply, ancestor_id)
  }
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

export const createCommentTree = (postID, root_commentID, commentsLookup, logErrors = false) => {
  const commentTree = []
  const commentsSortedByDate = Object.values(commentsLookup).sort(sortCreatedAsc)
  for (const [i, comment] of commentsSortedByDate.entries()) {
    comment.by_date_i = i
    comment.replies = []
    const parentID = comment.parent_id
    const parentID_short = parentID.substr(3)
    const parentComment = commentsLookup[parentID_short]
    if ((! root_commentID && parentID === 't3_'+postID) ||
         comment.id === root_commentID) {
      //add root comment
      commentTree.push(comment)
    } else if (parentComment === undefined && ! root_commentID && logErrors) {
      // don't show error if root_commentID is defined b/c in that case
      // the pushshift query may return results that can't be shown
      console.error('MISSING PARENT ID:', parentID, 'for comment', comment)
    } else if (parentComment) {
      if (! parentComment.replies) {
        parentComment.replies = []
      }
      parentComment.replies.push(comment)
    }
  }
  setAncestors(commentTree)
  return [commentTree, commentsSortedByDate]
}

const setAncestors = (commentTree, ancestors = {}) => {
  for (const comment of commentTree) {
    comment.ancestors = ancestors
    const ancestorsOfChild = {[comment.id]: true, ...ancestors}
    setAncestors(comment.replies, ancestorsOfChild)
  }
}
