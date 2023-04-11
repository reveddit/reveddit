import {
  getComments as getRedditComments,
  getItems as getRedditItems,
  getSubredditAbout,
  oauth_reddit,
} from 'api/reddit'
import { getModerators } from 'api/reveddit'
import {
  getCommentsBySubreddit as pushshiftGetCommentsBySubreddit
} from 'api/pushshift'
import { getModlogsPromises } from 'api/common'
import { commentIsDeleted, commentIsRemoved, postIsDeleted, isEmptyObj,
  redirectToHistory,
} from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED,
         UNKNOWN_REMOVED, NOT_REMOVED, ANTI_EVIL_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import { combinedGetItemsBySubredditOrDomain } from 'data_processing/subreddit_posts'

export let useProxy = false

export const retrieveRedditComments_and_combineWithPushshiftComments = (pushshiftComments) => {
  let quarantined_subreddits
  if (useProxy) {
    const comments_array = Object.values(pushshiftComments)
    if (comments_array.length) {
      // when useProxy=true, all comments are from the same subreddit
      quarantined_subreddits = comments_array[0].subreddit
    }
  }
  return getRedditComments({objects: pushshiftComments, quarantined_subreddits, useProxy})
  .then(redditComments => {
    return combinePushshiftAndRedditComments(pushshiftComments, redditComments)
  })
}

const copy_fields = ['permalink', 'score', 'controversiality',
                     'locked', 'collapsed', 'edited',
                     'subreddit_subscribers', 'quarantine', 'url',
                     'link_title',
                     // below fields added for modlog comments that may not appear in pushshift yet
                     // and were added to the pushshiftComments object
                     'subreddit', 'created_utc', 'parent_id']

const copy_if_value_fields = ['distinguished', 'stickied', 'author_fullname', 'removal_reason', 'from_add_user']

export const initializeComment = (comment, post) => {
  if (post && post.author === comment.author && comment.author !== '[deleted]') {
    comment.is_op = true
  }
  comment.replies = []
  comment.ancestors = {}
}

const markRemoved = (redditComment, commentToMark, is_reddit = false) => {
  if (redditComment.removed || commentIsRemoved(redditComment) || redditComment.removal_reason) {
    commentToMark.removed = true
    if (redditComment.removal_reason) {
      commentToMark.removedby_evil = ANTI_EVIL_REMOVED
    } else if (is_reddit) {
      commentToMark.removedby = UNKNOWN_REMOVED
    }
  } else if (commentIsDeleted(redditComment)) {
    commentToMark.deleted = true
  }
}

export const set_link_permalink = (revedditComment, redditComment) => {
  revedditComment.link_permalink = redditComment.permalink.split('/').slice(0,6).join('/')+'/'
}

export const combinePushshiftAndRedditComments = (pushshiftComments, redditComments, requirePushshiftData=false, post=undefined) => {
  const combinedComments = {}
  if (! requirePushshiftData) {
    Object.values(redditComments).forEach(comment => {
        initializeComment(comment, post)
        combinedComments[comment.id] = comment
        markRemoved(comment, comment, true)
    })
  }
  // Replace pushshift data with reddit and mark removedby
  Object.values(pushshiftComments).forEach(ps_comment => {
    const redditComment = redditComments[ps_comment.id]
    if (redditComment) {
      markRemoved(redditComment, ps_comment)
    }
    ps_comment.name = 't1_'+ps_comment.id // name needed for info page render
    initializeComment(ps_comment, post)
    if (ps_comment.archive_processed) {
      combinedComments[ps_comment.id] = ps_comment
    } else if (redditComment !== undefined) {
      setupCommentMeta(ps_comment, redditComment)
      combinedComments[ps_comment.id] = ps_comment
    } else {
      // known issue: r/all/comments?before=1538269380 will show some comments whose redditComment has no data
      //              looks like spam that was removed
      //console.log(ps_comment.id)
    }
  })
  console.log(`Pushshift: ${Object.keys(pushshiftComments).length} comments`)
  console.log(`Reddit: ${Object.keys(redditComments).length} comments`)
  return combinedComments
}

// if dont_overwrite is true and target[field] is not '' or null, then the field's value won't be copied
// this allows displaying the originally archived value, if one exists, and only showing the live value if it doesn't overwrite a previous one
export const copyFields = (fields, source, target, if_value = false, dont_overwrite = false) => {
  for (const field of fields) {
    if (! if_value || (source[field] && (! dont_overwrite || ! target[field]))) {
      target[field] = source[field]
    }
  }
}

const setupCommentMeta = (archiveComment, redditComment) => {
  const retrievalLatency = archiveComment.retrieved_on ? archiveComment.retrieved_on - archiveComment.created_utc : 9999
  set_link_permalink(archiveComment, redditComment)
  copyFields(copy_fields, redditComment, archiveComment)
  copyFields(copy_if_value_fields, redditComment, archiveComment, true)
  copyFields(['author_flair_text'], redditComment, archiveComment, true, true)
  if (! redditComment.link_title) {
    archiveComment.link_title = redditComment.permalink.split('/')[5].replace(/_/g, ' ')
  }
  if (typeof(redditComment.num_comments) !== 'undefined') {
    archiveComment.num_comments = redditComment.num_comments
  }
  if (! redditComment.deleted) {
    const modlog = archiveComment.modlog
    const modlog_says_bot_removed = modlogSaysBotRemoved(modlog, redditComment)
    if (archiveComment.body) {
      // Some pushshift comments have body = [deleted] whereas reddit has [removed]
      // In this case, use reddit's value
      if (commentIsDeleted(archiveComment)) {
        archiveComment.body = redditComment.body
      }
      // on r/subreddit/comments pages this is inaccurate b/c modlogs are only combined with the first set of results from pushshift
      // so, the 'temporarily visible' tag there is missing for older comments
      // works fine on thread pages: when combine is done, all results from pushshift are available to compare with modlogs
      archiveComment.archive_body_removed_before_modlog_copy = commentIsRemoved(archiveComment)
    } else if (modlog && ! commentIsRemoved(modlog)) {
      //handles case where the archive has no record of the comment
      archiveComment.archive_body_removed_before_modlog_copy = true
    }
    if (modlog && ! archiveComment.from_add_user && ! redditComment.removal_reason) {
      archiveComment.author = modlog.author
      archiveComment.body = modlog.body
    }
    if (archiveComment.body && archiveComment.author) {
      archiveComment.archive_body_removed = commentIsRemoved(archiveComment)
    }
    //- redditComments with .from_add_user=true will have .removed=true and, unintuitively, ! commentIsRemoved()
    //  so, ! commentIsRemoved() by itself is not sufficient to check removal status at this point
    if (! commentIsRemoved(redditComment) && ! redditComment.removed) {
      if (! archiveComment.removed) {
        if (archiveComment.archive_body_removed || modlog_says_bot_removed) {
          archiveComment.removedby = AUTOMOD_REMOVED_MOD_APPROVED
        } else {
          archiveComment.removedby = NOT_REMOVED
        }
      }
      archiveComment.author = redditComment.author
      archiveComment.body = redditComment.body
    } else {
      //- comments removed by reddit, but not by a moderator, will also have .removed=true and ! commentIsRemoved(),
      //  which makes them land in this block. Do not add a mod/auto label for those
      if (! redditComment.removal_reason || commentIsRemoved(redditComment)) {
        if (archiveComment.archive_body_removed || ! archiveComment.retrieved_on) {
          if ( retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD || modlog_says_bot_removed) {
            archiveComment.removedby = AUTOMOD_REMOVED
          } else {
            archiveComment.removedby = UNKNOWN_REMOVED
          }
        } else if (modlog_says_bot_removed) {
          archiveComment.removedby = AUTOMOD_REMOVED
        } else {
          archiveComment.removedby = MOD_OR_AUTOMOD_REMOVED
        }
      }
      // comments from add_user should always override whatever is in the archive
      if (redditComment.from_add_user && ! redditComment.removal_reason) {
        archiveComment.author = redditComment.author
        archiveComment.body = redditComment.body
      }
    }
  } else if (commentIsDeleted(redditComment)) {
    // modlog entries that were later deleted by the user didn't have author and body fields,
    // causing errors in later processing where those fields are assumed to exist
    archiveComment.author = redditComment.author
    archiveComment.body = redditComment.body
  }

  archiveComment.archive_processed = true
}

// Using Pushshift (getPushshiftPostsForCommentData) may be faster, but it is missing the quarantine field in submissions data
export const getPostDataForComments = ({comments = undefined, link_ids_set = undefined, quarantined_subreddits}) => {
  if (! link_ids_set) {
    link_ids_set = Object.values(comments).reduce((map, obj) => (map[obj.link_id] = true, map), {})
  }
  if (comments) {
    const comments_array = Object.values(comments)
    if (useProxy && comments_array.length && ! quarantined_subreddits) {
      // when useProxy=true, all comments are from the same subreddit
      quarantined_subreddits = comments_array[0].subreddit
    }
  }
  return getRedditItems({ids: Object.keys(link_ids_set), quarantined_subreddits, key: 'name', useProxy})
  .catch(() => { console.error(`Unable to retrieve full titles from ${source}`) })
}

export const applyPostAndParentDataToComment = (postData, comment, applyPostLabels = true) => {
  const post = postData[comment.link_id]
  if (post.title) {
    comment.link_title = post.title
  }
  comment.link_flair_text = post.link_flair_text
  comment.link_created_utc = post.created_utc
  comment.link_score = post.score
  if (post.url) {
    comment.url = post.url
  }
  if (typeof(post.num_comments) !== 'undefined') {
    comment.num_comments = post.num_comments
  }
  ['quarantine', 'subreddit_subscribers'].forEach(field => {
    comment[field] = post[field]
  })
  if ('author' in post && post.author === comment.author
      && comment.author !== '[deleted]') {
    comment.is_op = true
  }
  if (! post.over_18 && ! comment.over_18 && applyPostLabels) {
    if (! post.is_robot_indexable) {
      if (postIsDeleted(post)) {
        comment.post_removed_label = 'deleted'
      } else {
        comment.post_removed_label = 'removed'
      }
    }
    const parent = postData[comment.parent_id]
    if (comment.parent_id.slice(0,2) === 't1' && parent) {
      if (commentIsRemoved(parent)) {
        comment.parent_removed_label = 'removed'
      } else if (commentIsDeleted(parent)) {
        comment.parent_removed_label = 'deleted'
      }
    }
  }
}

export const getRevdditComments = ({pushshiftComments, subreddit_about_promise = Promise.resolve({})}) => {
  const postDataPromise = getPostDataForComments({comments: pushshiftComments})
  const combinePromise = retrieveRedditComments_and_combineWithPushshiftComments(pushshiftComments)
  return Promise.all([postDataPromise, combinePromise, subreddit_about_promise])
  .then(values => {
    const show_comments = []
    const postData = values[0]
    const combinedComments = values[1]
    const subredditAbout = values[2] || {}
    Object.values(combinedComments).forEach(comment => {
      if (postData && comment.link_id in postData) {
        const post_thisComment = postData[comment.link_id]
        if ( ! (post_thisComment.whitelist_status === 'promo_adult_nsfw' &&
               (comment.removed || comment.deleted))) {
          applyPostAndParentDataToComment(postData, comment, ! subredditAbout.over18)
          show_comments.push(comment)
        }
      } else {
        show_comments.push(comment)
      }
    })
    return show_comments
  })
}

export const copyModlogItemsToArchiveItems = (modlogsItems, archiveItems) => {
  for (const ml_item of Object.values(modlogsItems)) {
    const id = ml_item.id
    if (! id) {
      continue
    }
    const link_id = ml_item.link_id
    const archive_item = archiveItems[id]
    const modlog = {
      author: ml_item.target_author,
      body: ml_item.target_body,
      link_id,
      created_utc: ml_item.created_utc,
      mod: ml_item.mod,
      details: ml_item.details,
      log_source: ml_item.log_source,
      action: ml_item.action || '',
      automodActionReason: ml_item.automodActionReason || '',
    }
    if (ml_item.automodActionReason && ! modlog.mod) {
      modlog.mod = 'AutoModerator'
    }
    if (archive_item) {
      archive_item.modlog = modlog
    } else {
      archiveItems[id] = {id, link_id, modlog}
    }
  }
}

export const combinedGetCommentsBySubreddit = (args) => {
  return combinedGetItemsBySubredditOrDomain({...args,
    pushshiftQueryFn: pushshiftGetCommentsBySubreddit,
    postProcessCombine_Fn: getRevdditComments,
    postProcessCombine_ItemsArgName: 'pushshiftComments',
  })
}

export const setSubredditMeta = async (subreddit, global) => {
  let moderators_promise = getModerators(subreddit)
  let subreddit_about_promise = getSubredditAbout(subreddit)
  let over18 = false
  let quarantined = false
  const setQuarantined = (value) => {
    quarantined = value
  }
  const subreddit_lc = subreddit.toLowerCase()
  await Promise.all([moderators_promise, subreddit_about_promise])
  .catch((e) => {
    if (e.reason === 'quarantined') {
      useProxy = true
      setQuarantined(true)
      subreddit_about_promise = getSubredditAbout(subreddit, true)
    }
    return Promise.all([moderators_promise, subreddit_about_promise])
  })
  .then(([moderators, subreddit_about]) => {
    if (((isEmptyObj(moderators) || moderators.error) && isEmptyObj(subreddit_about)) || [subreddit_about.reason, moderators.reason].some(w => /^\b(private|banned)\b$/.test(w))) {
      redirectToHistory(subreddit)
    }
    over18 = subreddit_about.over18
    if (! quarantined && subreddit_about.hasOwnProperty('quarantine')) {
      setQuarantined(subreddit_about.quarantine)
    }
    global.setState({
      moderators: {[subreddit_lc]: moderators},
      over18,
      quarantined,
    })
  })
  return {subreddit_about_promise}
}

export const getRevdditCommentsBySubreddit = async (subreddit, global, archive_times_promise) => {
  const {n, before, before_id, after} = global.state

  if (subreddit === 'all') {
    subreddit = ''
  }
  const {subreddit_about_promise} = await setSubredditMeta(subreddit, global)
  const modlogs_promises = await getModlogsPromises(subreddit, 'comments')
  await archive_times_promise
  const archiveTimes = global.state.archiveTimes
  return combinedGetCommentsBySubreddit({global, subreddit, n, before, before_id, after,
    subreddit_about_promise, modlogs_promises, archiveTimes})
  .then(global.returnSuccess)
}

export const modlogSaysBotRemoved = (modlog, item) => {
  return modlog &&
    ((modlog.created_utc - item.created_utc) <= AUTOMOD_LATENCY_THRESHOLD
    || ['automoderator', 'bot'].includes(modlog.mod.toLowerCase()))
}
