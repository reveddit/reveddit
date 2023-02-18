import { combinePushshiftAndRedditComments, copyModlogItemsToArchiveItems,
} from 'data_processing/comments'
import { combineRedditAndPushshiftPost } from 'data_processing/posts'
import {
  getPost as getPushshiftPost,
  getCommentsByThread as getPushshiftCommentsByThread,
  commentsByThreadReturnValueDefaults,
  getCommentsByID as getPushshiftComments,
  PUSHSHIFT_MAX_COUNT_PER_QUERY,
} from 'api/pushshift'
import {
  getComments as getRedditComments,
  getPostWithComments as getRedditPostWithComments,
  getModlogsComments, getModlogsPosts,
} from 'api/reddit'
import { getAuth } from 'api/reddit/auth'
import {
  submitMissingComments, getUmodlogsThread, getModerators,
  getCommentsByThread, getArchivedCommentsByID,
} from 'api/reveddit'
import {
  redditLimiter, pushshiftLimiter,
} from 'api/common'
import { itemIsRemovedOrDeleted, postIsDeleted, postIsRemoved, jumpToHash,
         convertPathSub, sortCreatedAsc, validAuthor, commentIsRemoved,
         commentIsDeleted,
} from 'utils'
import {AddUserParam, AddUserItem, getUserCommentsForPost,
        addUserComments, addUserComments_and_updateURL,
        getAddUserMeta, get_userPageSortAndTime,
} from 'data_processing/RestoreComment'
import { localSort_types, filter_pageType_defaults, create_qparams } from 'state'

const NumAddUserItemsToLoadAtFirst = 10
const numCommentsWithPost = 500
const NumPushshiftResultsConsideredAsFull = PUSHSHIFT_MAX_COUNT_PER_QUERY*.8
let archiveError = false

export const ignoreArchiveErrors_comments = () => ignoreArchiveErrors(commentsByThreadReturnValueDefaults)

const ignoreArchiveErrors = (returnValue = {}) => {
  archiveError = true
  // clone here so that the passed in object doesn't get used later and potentially modified
  return JSON.parse(JSON.stringify(returnValue))
}
let useProxy = false

// maps reddit sort value to reveddit sort
const sortMap = {
  controversial: {localSort: localSort_types.controversiality1},
            new: {localSort: localSort_types.date},
            old: {localSort: localSort_types.date, localSortReverse: true},
}

const scheduleAddUserItems = (addUserItems) => addUserItems.map(item => redditLimiter.schedule(() => item.query()))

const processAddUserPromises = async (promises, combinedComments, reddit_post) => {
  return await Promise.all(promises)
    .then(userPages => getUserCommentsForPost(reddit_post, combinedComments, userPages))
}

const addRemainingRedditComments_andCombine = async (quarantined_subreddits, reddit_post, pushshiftComments, redditComments, ids, user_comments, add_user, updateURL = false) => {
  if (ids.length) {
    const remainingRedditComments = await getRedditComments({ids, quarantined_subreddits, useProxy})
    Object.values(remainingRedditComments).forEach(comment => {
      redditComments[comment.id] = comment
    })
  }
  // consider: change this logic to update combinedComments incrementally rather than recreating it from scratch
  // currently, combinePushshiftAndRedditComments() is called 3x or 4x:
  //     once with only reddit comments
  //     once with all Pushshift comments and some reddit comments
  //     once with all Pushshift comments and remaining reddit comments
  //     (depends..) once if we found any removed leaf comments
  // The third call, here, could simply update based on the remainingRedditComments
  // To do that, would need to use early_combinedComments as the basis for a return value
  const combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
  let changed = [], new_add_user
  if (updateURL) {
    ({new_add_user, changed} = addUserComments_and_updateURL(user_comments, combinedComments, add_user))
  } else {
    ({changed} = addUserComments(user_comments, combinedComments))
  }
  return {combinedComments, changed, new_add_user}
}


export const getRevdditThreadItems = async (threadID, commentID, context, add_user, user_kind, user_sort, user_time,
                                            before, after, subreddit,
                                            global, archive_times_promise) => {
  const {localSort, localSortReverse, ps_after} = global.state
  let { quarantined } = global.state
  let quarantined_subreddits
  if (quarantined) {
    useProxy = true
    quarantined_subreddits = subreddit
  }
  const ps_after_set = ps_after ? new Set(ps_after.split(',').slice(0,20)) : new Set()
  const ps_after_list = ps_after ? [...ps_after_set] : []
  const sort = create_qparams().get('sort') // don't get this value from state. it's used elsewhere w/a default value 'new' which isn't desired here
  const localStateForURLUpdate = (sortMap[sort] && localSort === filter_pageType_defaults.localSort.thread && ! localSortReverse) ? sortMap[sort] : {}
  const sortsForRedditCommentThreadQuery = sort ? sort.split(',') : ['new']
  let pushshift_comments_promise = Promise.resolve({})
  let reveddit_comments_promise = Promise.resolve({})
  let pushshift_remaining_promises = []
  if (! commentID) {
    pushshift_comments_promise = pushshiftLimiter.schedule(() => getPushshiftCommentsByThread(threadID).catch(ignoreArchiveErrors_comments))
  }
  const schedulePsAfter = async (this_ps_after) => {
    await archive_times_promise
    const archiveTimes = global.state.archiveTimes
    pushshift_remaining_promises.push(
      pushshiftLimiter.schedule(() => getPushshiftCommentsByThread(threadID, this_ps_after).catch(ignoreArchiveErrors_comments)))
  }
  if (ps_after) {
    for (const this_ps_after of ps_after_list) {
      await schedulePsAfter(this_ps_after)
    }
  }
  await getAuth()
  const add_user_promises = [], add_user_promises_remainder = []
  const add_user_authors = {}
  if (add_user) {
    const addUserItems = (new AddUserParam({string: add_user})).getItems()
    const addUserItems_first = addUserItems.slice(0,NumAddUserItemsToLoadAtFirst)
    add_user_promises.push(...scheduleAddUserItems(addUserItems_first))
    const addUserItems_remainder = addUserItems.slice(NumAddUserItemsToLoadAtFirst)
    add_user_promises_remainder.push(...scheduleAddUserItems(addUserItems_remainder))
    Object.assign(add_user_authors, addUserItems.reduce((map,item) => (map[item.author] = 1, map), {}))
  }
  let root_comment_promise = Promise.resolve({})
  let pushshift_post_promise = Promise.resolve(undefined)
  if (commentID) {
    root_comment_promise = getRedditComments({ids: [commentID], quarantined_subreddits})
  }
  const uModlogs_promise = getUmodlogsThread(subreddit, threadID)
  const reddit_pwc_baseArgs = {
    threadID, commentID, context, limit: numCommentsWithPost,
    subreddit
  }
  const reddit_pwc_baseArgs_firstQuery = {...reddit_pwc_baseArgs, sort: 'top', useProxy}
  const reddit_pwc_promise = getRedditPostWithComments(reddit_pwc_baseArgs_firstQuery)
  .catch(e => {
    if (e.message === 'Forbidden' && ! useProxy) {
      useProxy = true
      return getRedditPostWithComments({...reddit_pwc_baseArgs_firstQuery, useProxy})
    }
    throw new Error('unable to retrieve data from reddit')
  })
  .then(async ({post: reddit_post, comments: redditComments, moreComments, oldestComment}) => {
    const moderators_promise = getModerators(reddit_post.subreddit)
    const modlogs_comments_promise = getModlogsComments({subreddit: reddit_post.subreddit, link_id: reddit_post.id, limit: 500})
    let modlogs_posts_promise = Promise.resolve({})
    const use_fields_for_manually_approved_lookup = ! ((postIsRemoved(reddit_post) && (reddit_post.is_self || reddit_post.is_gallery)) || postIsDeleted(reddit_post))
    pushshift_post_promise = pushshiftLimiter.schedule(() => getPushshiftPost({id: threadID, use_fields_for_manually_approved_lookup}).catch(ignoreArchiveErrors))
    modlogs_posts_promise = getModlogsPosts({subreddit: reddit_post.subreddit, link_id: reddit_post.id})
    document.title = reddit_post.title
    if (reddit_post.quarantine && ! quarantined) {
      quarantined = true
      quarantined_subreddits = reddit_post.subreddit
      root_comment_promise = getRedditComments({ids: [commentID], quarantined_subreddits})
      //      Update URL to mark thread as quarantined so future add_user params,
      //      which will be saved below, then potentially shared, will, when queried
      //      among the first requests of getRevdditThreadItems(), know up front that the subreddit
      //      is quarantined
      localStateForURLUpdate.quarantined = true
    }
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
      oldest_comment_promise = getRedditComments({ids: [commentID], quarantined_subreddits, useProxy})
      .then(oldestComments => {
        oldestComment = oldestComments[commentID] || {}
        Object.assign(redditComments, oldestComments)
        return oldestComment
      })
    }
    oldestComment = await oldest_comment_promise
    const reddit_comments_promises = [Promise.resolve({comments: redditComments, moreComments})]
    let root_comment_id
    if (commentID) {
      root_comment_id = oldestComment.id
      const after = oldestComment.created_utc - 1
      const focus_comment_removed = redditComments[commentID] && commentIsRemoved(redditComments[commentID])
      reveddit_comments_promise = getCommentsByThread({
        comment_id: commentID,
        ...(focus_comment_removed && {focus_comment_removed}),
        link_id: threadID, after, root_comment_id,
        num_comments: reddit_post.num_comments,
        post_created_utc: reddit_post.created_utc,
      })
      pushshift_comments_promise = pushshiftLimiter.schedule(() => getPushshiftCommentsByThread(threadID, after).catch(ignoreArchiveErrors_comments))
    } else {
      reveddit_comments_promise = getCommentsByThread({
        link_id: threadID, after, root_comment_id,
        num_comments: reddit_post.num_comments,
        post_created_utc: reddit_post.created_utc,
      })
    }
    const {user_comments, newComments: remainingRedditIDs} = await processAddUserPromises(add_user_promises, redditComments, post_without_pushshift_data)
    const {combinedComments} = await addRemainingRedditComments_andCombine(quarantined_subreddits, post_without_pushshift_data, {}, redditComments, Object.keys(remainingRedditIDs), user_comments)

    const [commentTree, itemsSortedByDate] = createCommentTree(threadID, root_comment_id, combinedComments)
    await global.setState({...localStateForURLUpdate,
                           threadPost: post_without_pushshift_data,
                           items: itemsSortedByDate, itemsSortedByDate,
                           itemsLookup: combinedComments,
                           commentTree,
                           initialFocusCommentID: commentID,
                           quarantined, quarantined_subreddits,
                         })
    .then(() => {
      if (Object.keys(localStateForURLUpdate).length) {
        global.updateURLFromGivenState('thread', {...localStateForURLUpdate})
      }
    })
    jumpToHash(window.location.hash)
    // Add 100 to threshhold b/c if post.num_comments <= numCommentsWithPost, first call could return
    // numCommentsWithPost and second call (sort by 'new') might return 50.
    // In that case you still need to call api/info, getting 100 items per request.
    // Needs more testing, setting numCommentsWithPost=500 seemed slower than 100
    if (reddit_post.num_comments > numCommentsWithPost+100 && ! commentID) {
      reddit_comments_promises.push(...sortsForRedditCommentThreadQuery.map(sort => getRedditPostWithComments({...reddit_pwc_baseArgs, sort, useProxy})))
    }
    return {reddit_post, root_comment_id, reddit_comments_promises, resetPath,
            reveddit_comments_promise, pushshift_comments_promise,
            moderators_promise, modlogs_comments_promise, modlogs_posts_promise, user_comments}
  })

  reddit_pwc_promise.then(async ({reddit_post, modlogs_posts_promise}) => {
    const modlogsPosts = await modlogs_posts_promise
    const ps_post = await pushshift_post_promise
    const uModlogsItems = await uModlogs_promise
    const uModlogsPost = uModlogsItems.posts[threadID]
    const combined_post = combineRedditAndPushshiftPost(reddit_post, ps_post)
    document.title = combined_post.title
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
  const {reddit_post, reddit_comments_promises, resetPath,
          moderators_promise, modlogs_comments_promise, user_comments} = await reddit_pwc_promise
  let {root_comment_id} = await reddit_pwc_promise
  const redditCommentsResults = await Promise.all(reddit_comments_promises)
  const redditComments = {}, moreComments = {}
  for (const {comments: thisRC, moreComments: thisMC} of redditCommentsResults) {
    Object.assign(redditComments, thisRC)
    Object.assign(moreComments, thisMC)
  }
  const pushshiftResult = await pushshift_comments_promise
  const {comments: pushshiftComments} = pushshiftResult
  let {last:last_ps_created_utc} = pushshiftResult
  const revedditComments = await reveddit_comments_promise
  const modlogsComments = await modlogs_comments_promise
  const uModlogsItems = await uModlogs_promise
  const rootComment = await root_comment_promise
  if (rootComment && rootComment[commentID] && ! redditComments[commentID]) {
    redditComments[commentID] = rootComment[commentID]
  }
  // await pushshift_remaining_promises, put the results into pushshiftComments
  // an alternate code location for this is after the next global.setState
  // the reason to put it here is,
  //     (a) the focus comment lookup may preempt user page lookups which often add to URL despite not finding target content
  //     (b) these lookups are fast enough now
  const remainingPushshiftResults = await Promise.all(pushshift_remaining_promises)
  let last_ps_comment_created_utc = last_ps_created_utc
  let num_comments_in_last_ps_query = Object.keys(pushshiftComments).length
  for (const {comments, last} of remainingPushshiftResults) {
    Object.assign(pushshiftComments, comments)
    const comments_length = Object.keys(comments).length
    if (last > last_ps_comment_created_utc && comments_length) {
      last_ps_comment_created_utc = last
      num_comments_in_last_ps_query = comments_length
    }
  }

  let new_ps_after = ps_after
  if (last_ps_created_utc
      && reddit_post.num_comments > num_comments_in_last_ps_query
      && num_comments_in_last_ps_query > NumPushshiftResultsConsideredAsFull) {
    let this_psComments = undefined
    let next_ps_after = (last_ps_created_utc - 1).toString()
    // if the first next_ps_after was already queried, start from most recent ps comment
    // (only if the last query had a nearly full result)
    if (ps_after_set.has(next_ps_after)) {
      next_ps_after = (last_ps_comment_created_utc - 1).toString()
    }
    // loop for all comments until result is less than max response size (indicating there are no more results)
    while (! ps_after_set.has(next_ps_after)) {
      ps_after_set.add(next_ps_after)
      const {comments, last} = await pushshiftLimiter.schedule(() =>
        getPushshiftCommentsByThread(threadID, next_ps_after).catch(ignoreArchiveErrors_comments))
      this_psComments = comments
      last_ps_created_utc = last
      Object.assign(pushshiftComments, this_psComments)
      new_ps_after = global.get_updated_ps_after(next_ps_after, new_ps_after)
      if (Object.keys(this_psComments).length < NumPushshiftResultsConsideredAsFull) {
        break
      }
      next_ps_after = (last_ps_created_utc - 1).toString()
    }
  }

  for (const c of Object.values(revedditComments)) {
    const psComment = pushshiftComments[c.id]
    if (! psComment || commentIsRemoved(psComment) || commentIsDeleted(psComment)) {
      pushshiftComments[c.id] = c
    }
  }
  copyModlogItemsToArchiveItems(modlogsComments, pushshiftComments)
  //copy uModlogs items last b/c:
  // 1. these will overwrite any previous modlogs items
  // 2. the content will probably be retrievable in the future, since lookup method is by link ID.
  //    And, when log_source == u_modlogs, then 'temporarily visible' label is not shown
  copyModlogItemsToArchiveItems(uModlogsItems.comments, pushshiftComments)
  let focusComment_pushshift = pushshiftComments[commentID]
  const focusComment_reddit = redditComments[commentID]


  // fill in focus comment: not needed when querying for all pushshift results
  // if (focusComment_reddit && commentIsRemoved(focusComment_reddit)
  //     && (! focusComment_pushshift ||
  //         (commentIsRemoved(focusComment_pushshift)
  //           && ! focusComment_pushshift.retrieved_on))) {
  //   const focusComment_ps_after = (focusComment_reddit.created_utc - 1).toString()
  //   if (! ps_after_list.includes(focusComment_ps_after)) {
  //     await schedulePsAfter(focusComment_ps_after)
  //     new_ps_after = global.get_updated_ps_after(focusComment_ps_after)
  //   }
  // }

  // must update focusComment_pushshift b/c it will be overwritten if "fill in focus comment" code above succeeds
  focusComment_pushshift = pushshiftComments[commentID]


  let new_add_user
  let forURL_timeSort_meta = {userPageSort: 'new', userPageTime: 'all'}
  const add_user_promises_forURL = []
  if (! focusComment_pushshift && ! focusComment_reddit) {
    commentID = undefined
    root_comment_id = undefined
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
        const aui = new AddUserItem({author: focusCommentAuthor, quarantined_subreddits})
        add_user_promises_forURL.push(aui.query())
      }
    }
  }
  const origRedditComments = {...redditComments}
  const early_combinedComments = combinePushshiftAndRedditComments(pushshiftComments, redditComments, false, reddit_post)
  const [early_commentTree, early_itemsSortedByDate] = createCommentTree(threadID, root_comment_id, early_combinedComments, false)
  const {alreadySearchedAuthors} = global.state // should be empty on page load, getting in case that changes
  // attempt to restore directly linked unarchived removed comment
  // if a directly linked comment is removed, auto-click the 'restore' button once.
  const restoreDirectlyLinkedUnarchivedRemovedComment = async (focusComment, state) => {
    if (focusComment && commentIsRemoved(focusComment)) {
      state.threadPost = reddit_post // only need author from this
      state.alreadySearchedAuthors = alreadySearchedAuthors
      forURL_timeSort_meta = get_userPageSortAndTime(focusComment)
      // previously was setting sort = 'new' and time = 'all' w/note about that making combining results easier
      // I think that is fixed now by recording time/sort meta in forURL_timeSort_meta
      const {aug} = getAddUserMeta(focusComment, 0,
        forURL_timeSort_meta.userPageSort, forURL_timeSort_meta.userPageTime, state)
      // waiting for aug.query(), which is async, to return its data. does not wait for the returned promises
      const {authors, promises} = await aug.query()
      Object.assign(alreadySearchedAuthors, authors)
      return promises
    }
    return [] // return no promises
  }
  if (! add_user && commentID) {
    // only run here if add_user is not set b/c add_user data hasn't been incorporated yet.
    const promises = await restoreDirectlyLinkedUnarchivedRemovedComment(early_combinedComments[commentID], {
      itemsLookup: early_combinedComments,
      itemsSortedByDate: early_itemsSortedByDate,
    })
    add_user_promises_forURL.push(...promises)
  }
  await global.setState({items: early_itemsSortedByDate,
             itemsSortedByDate: early_itemsSortedByDate,
                   itemsLookup: early_combinedComments,
                   commentTree: early_commentTree,
         initialFocusCommentID: commentID,
                                alreadySearchedAuthors,
                      ps_after: new_ps_after,
  })

  const {user_comments: user_comments_forURL, newComments: remainingRedditIDs} = await processAddUserPromises(add_user_promises_forURL, early_combinedComments, reddit_post)

  // <---- await pushshift_remaining_promises alternate code location ---->

  // when commentID is set, do additional checking to see if added comments would be in the tree or not
  Object.values(pushshiftComments).sort(sortCreatedAsc).forEach(archiveComment => {
    const id = archiveComment.id
    const parentID = archiveComment.parent_id?.substr(0,2) === 't1' ? archiveComment.parent_id.substr(3) : null
    if (! (id in redditComments)
          && (! commentID
              || archiveComment.wayback_path
              || (parentID && (
                parentID in redditComments || parentID in remainingRedditIDs
              )))) {
      remainingRedditIDs[id] = 1
      // add missing parents.
      // previously, a single pushshift request would return all comments for a thread, so this wasn't necessary
      // now the number of comments retrieved per request is limited to 100.
      // adding parents is an easy way to fix some broken chains
      // without making extra requests to pushshift for all comments
      if (! commentID && parentID
          && ! (parentID in redditComments)
          && ! (parentID in remainingRedditIDs)) {
        remainingRedditIDs[parentID] = 1
      }
    }
  })

  const {combinedComments} = await addRemainingRedditComments_andCombine(quarantined_subreddits, reddit_post, pushshiftComments, redditComments, Object.keys(remainingRedditIDs), user_comments)
  let changed
  ({new_add_user, changed} = addUserComments_and_updateURL(user_comments_forURL, combinedComments, add_user,
    forURL_timeSort_meta.userPageSort, forURL_timeSort_meta.userPageTime))
  //could: check if pushshiftComments has any parent_ids that are not in combinedComments
  //      and do a reddit query for these. Possibly query twice if the result has items whose parent IDs
  //      are not in combinedComments after adding the result of the first query
  const [commentTree, itemsSortedByDate] = createCommentTree(threadID, root_comment_id, combinedComments, true)
  const stateObj = {items: itemsSortedByDate,
                    itemsLookup: combinedComments,
                    commentTree, itemsSortedByDate,
                    add_user: new_add_user || add_user,
                    add_user_on_page_load: 0,
  }

  const processAUP_addRemaining_combine = async (promises, combinedComments_input, add_user, updateURL = false) => {
    const {user_comments, newComments} = await processAddUserPromises(promises, combinedComments_input, reddit_post)
    const {combinedComments, changed, new_add_user} = await addRemainingRedditComments_andCombine(quarantined_subreddits, reddit_post, pushshiftComments, redditComments, Object.keys(newComments), user_comments, add_user, updateURL)
    return {combinedComments, changed, new_add_user}
  }

  // when add_user is set, restoreDirectlyLinkedUnarchivedRemovedComment runs here instead of above
  let commentsUpdated_treeNotYetRebuilt = false
  if (add_user && commentID) {
    const promises = await restoreDirectlyLinkedUnarchivedRemovedComment(combinedComments[commentID], stateObj)
    if (promises.length) {
      commentsUpdated_treeNotYetRebuilt = true
      const updated_add_user = new_add_user || add_user
      const {combinedComments: combinedComments_2,
                      changed: changed_2,
                 new_add_user: newer_add_user,
      } = await processAUP_addRemaining_combine(promises, combinedComments, updated_add_user, true)
      stateObj.itemsLookup = combinedComments_2
      stateObj.add_user_on_page_load += changed_2.length
      stateObj.add_user = newer_add_user || updated_add_user
    }
  }
  const remaining_removed_comment_ids = []
  let oldestRemainingRemovedComment = undefined
  for (const c of Object.values(stateObj.itemsLookup)) {
    if (c.score != 1 && ! revedditComments[c.id] && commentIsRemoved(c)) {
      remaining_removed_comment_ids.push(c.id)
      if (! oldestRemainingRemovedComment || c.created_utc < oldestRemainingRemovedComment.created_utc) {
        oldestRemainingRemovedComment = c
      }
    }
  }
  if (remaining_removed_comment_ids.length) {
    await archive_times_promise
    if (global.state.archiveTimes?.beta_comment > oldestRemainingRemovedComment.created_utc) {
      const remainingRemovedComments = await getArchivedCommentsByID(remaining_removed_comment_ids)
      combinePushshiftAndRedditComments(remainingRemovedComments, redditComments, true, reddit_post)
      Object.assign(stateObj.itemsLookup, remainingRemovedComments)
      commentsUpdated_treeNotYetRebuilt = true
    }
  }
  const missing = []
  markTreeMeta(missing, origRedditComments, moreComments, commentTree, reddit_post.num_comments, root_comment_id, commentID)
  if (missing.length) {
    submitMissingComments(missing)
  }
  const moderators = await moderators_promise
  const subreddit_lc = reddit_post.subreddit.toLowerCase()
  stateObj.add_user_on_page_load += changed.length
  const updateState = {
    moderators: {[subreddit_lc]: moderators},
  }
  Object.assign(stateObj, updateState)
  if (add_user_promises_remainder.length || commentsUpdated_treeNotYetRebuilt) {
    if (! commentsUpdated_treeNotYetRebuilt) {
      // only update state earlier when tree has already been rebuilt
      await global.setState(stateObj)
    }
    if (add_user_promises_remainder.length) {
      // n.b. removed comments whose entries (1) were not discovered via reddit and pushshift normal + beta lookups, and
      //                                     (2) are discovered here via add_user
      //      may have incorrect removedby labels. 'beta' has the correct retrieved_utc but we never looked up those IDs there.
      //      This will be resolved in the future when pushshift updates its api
      const {combinedComments: combinedComments_2, changed: changed_2} = await processAUP_addRemaining_combine(add_user_promises_remainder, stateObj.itemsLookup)
      stateObj.itemsLookup = combinedComments_2
      stateObj.add_user_on_page_load += changed_2.length
    }
    // NOTE: previous TODO: if removed_leaf_comments_promise exists, do not run this createCommentTree() when removed_leaf_comments_promise is set
    //       To do that, instead of storing comment objects in replies array,
    //       just store the IDs and use commentsLookup to retrieve them when used
    //  WHY: The previous "if (removed_leaf_comments_promise) {" code did not change reply IDs, it only changed the objects that represent them
    const [commentTree_2, itemsSortedByDate_2] = createCommentTree(threadID, root_comment_id, stateObj.itemsLookup)
    stateObj.commentTree = commentTree_2
    stateObj.itemsSortedByDate = itemsSortedByDate_2
    stateObj.items = itemsSortedByDate_2
    if (commentsUpdated_treeNotYetRebuilt) {
      await global.setState(stateObj)
    }
  }
  //set success/failure after everything from the archive is returned,
  //pushshift_post_promise will time out, and it only sends a request for self posts, so it's okay to wait for this non-critical request
  await pushshift_post_promise
  if (! archiveError) {
    return global.returnSuccess(stateObj)
  } else {
    return global.returnError(stateObj)
  }
}

export const insertParent = (child_id, global) => {
  let promise = Promise.resolve()
  let { items, itemsLookup, commentTree,
        threadPost, initialFocusCommentID,
        quarantined_subreddits,
  } = global.state
  const child = itemsLookup[child_id]
  const [parent_kind, parent_id] = child.parent_id.split('_')
  const parent = itemsLookup[parent_id]
  if (! parent && parent_kind === 't1') {
    promise = getRedditComments({ids: [parent_id], quarantined_subreddits, useProxy})
    .then(redditComments => {
      const comment = redditComments[parent_id]
      if (comment) {
        let combined = combinePushshiftAndRedditComments({}, redditComments, false, threadPost)
        let ps_promise = Promise.resolve(combined)
        if (comment.removed) {
          ps_promise = getPushshiftComments({ids: [parent_id]})
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
  } else if (parent && initialFocusCommentID) {

    //need this condition b/c when add_user is set on page load,
    //and top comment's context is clicked, the new ancestors might load w/out children
    //because although the current add_user logic does recreate the comment tree when adding new comments,
    //some 'inserted' comments might not connect until insertParent() runs a few times from successive clicks

    // Only run this condition when initialFocusCommentID is set.
    // In other cases, all comments should already have populated commentTree.
    // If you set commentTree = [parent] when all comments are already loaded, then you're pruning the root-level comments

    //only add child if it doesn't exist
    if (! parent.replies.filter(c => c.id === child.id).length) {
      parent.replies.push(child)
    }
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
const markTreeMeta = (missing, origRedditComments, moreComments, comments, post_numComments, root_comment_id, focusCommentID, depth = 0) => {
  const now = Math.floor((new Date).getTime()/1000)
  comments.forEach(comment => {
    comment.depth = depth
    if (! origRedditComments[comment.id]
        && (origRedditComments[comment.parent_id.substr(3)] || (! root_comment_id && comment.parent_id.slice(0,2) === 't3'))
        && (! focusCommentID || comment.ancestors[focusCommentID])
        && ! moreComments[comment.parent_id]
        && depth <= maxDepth && ! comment.removed && ! comment.deleted
        && (now - comment.created_utc) > 120) {
      missing.push(comment.id)
      comment.missing_in_thread = true
    }
    if (comment.replies.length && depth < maxDepth) {
      markTreeMeta(missing, origRedditComments, moreComments, comment.replies, post_numComments, root_comment_id, focusCommentID, depth+1)
    }
  })
}

export const createCommentTree = (postID, root_comment_id, commentsLookup, logErrors = false) => {
  const commentTree = []
  const parentsInTree = new Set()
  const commentsSortedByDate = Object.values(commentsLookup).sort(sortCreatedAsc)
  for (const [i, comment] of commentsSortedByDate.entries()) {
    comment.by_date_i = i
    comment.replies = []
    const parentID = comment.parent_id
    const parentID_short = parentID.substr(3)
    const parentComment = commentsLookup[parentID_short]

    if ((! root_comment_id && parentID === 't3_'+postID) ||
         comment.id === root_comment_id) {
      //add root comment
      commentTree.push(comment)
    } else if (parentComment === undefined && ! root_comment_id && logErrors) {
      // don't show error if root_comment_id is defined b/c in that case
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
