import {
  getComments as getRedditComments,
  getItems as getRedditItems,
  getModerators, getSubredditAbout,
  getModlogsComments
} from 'api/reddit'
import {
  getPostsByIDForCommentData as getPushshiftPostsForCommentData,
  getCommentsBySubreddit as getPushshiftCommentsBySubreddit
} from 'api/pushshift'
import { commentIsDeleted, commentIsRemoved, postIsDeleted } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED,
         UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

export const retrieveRedditComments_and_combineWithPushshiftComments = pushshiftComments => {
  return getRedditComments({objects: pushshiftComments})
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

const copy_if_value_fields = ['distinguished', 'stickied', 'author_fullname']

const initializeComment = (comment, post) => {
  if (post && post.author === comment.author && comment.author !== '[deleted]') {
    comment.is_op = true
  }
  comment.replies = []
  comment.ancestors = {}
}

const markRemoved = (redditComment, commentToMark, is_reddit = false) => {
  if (commentIsRemoved(redditComment)) {
    commentToMark.removed = true
    if (is_reddit) {
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
  Object.values(redditComments).forEach(comment => {
    if (! requirePushshiftData) {
      initializeComment(comment, post)
      combinedComments[comment.id] = comment
      markRemoved(comment, comment, true)
    }
    const ps_comment = pushshiftComments[comment.id]
    if (ps_comment) {
      markRemoved(comment, ps_comment)
    }
  })
  // Replace pushshift data with reddit and mark removedby
  Object.values(pushshiftComments).forEach(ps_comment => {
    const retrievalLatency = ps_comment.retrieved_on ? ps_comment.retrieved_on - ps_comment.created_utc : 9999
    const redditComment = redditComments[ps_comment.id]
    ps_comment.name = 't1_'+ps_comment.id // name needed for info page render
    initializeComment(ps_comment, post)
    if (ps_comment.processed) {
      combinedComments[ps_comment.id] = ps_comment
    } else if (redditComment !== undefined) {
      set_link_permalink(ps_comment, redditComment)
      copy_fields.forEach(field => {
        ps_comment[field] = redditComment[field]
      })
      copy_if_value_fields.forEach(field => {
        if (redditComment[field]) {
          ps_comment[field] = redditComment[field]
        }
      })
      if (! redditComment.link_title) {
        ps_comment.link_title = redditComment.permalink.split('/')[5].replace(/_/g, ' ')
      }

      if (typeof(redditComment.num_comments) !== 'undefined') {
        ps_comment.num_comments = redditComment.num_comments
      }
      if (! redditComment.deleted) {
        const modlog = ps_comment.modlog
        const modlog_says_bot_removed = modlogSaysBotRemoved(modlog, redditComment)
        if (modlog) {
          ps_comment.author = modlog.author
          ps_comment.body = modlog.body
        }
        if (! commentIsRemoved(redditComment)) {
          if (commentIsRemoved(ps_comment) || modlog_says_bot_removed) {
            ps_comment.removedby = AUTOMOD_REMOVED_MOD_APPROVED
          } else {
            ps_comment.removedby = NOT_REMOVED
          }
          ps_comment.author = redditComment.author
          ps_comment.body = redditComment.body
        } else {
          if (commentIsRemoved(ps_comment)) {
            if ( retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD || modlog_says_bot_removed) {
              ps_comment.removedby = AUTOMOD_REMOVED
            } else {
              ps_comment.removedby = UNKNOWN_REMOVED
            }
          } else if (modlog_says_bot_removed) {
            ps_comment.removedby = AUTOMOD_REMOVED
          } else {
            ps_comment.removedby = MOD_OR_AUTOMOD_REMOVED
          }
        }
      }
      ps_comment.processed = true
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

// Using Pushshift may be faster, but it is missing the quarantine field in submissions data
export const getPostDataForComments = ({comments = undefined, link_ids_set = undefined, source = 'reddit'}) => {
  if (! link_ids_set) {
    link_ids_set = Object.values(comments).reduce((map, obj) => (map[obj.link_id] = true, map), {})
  }
  let queryFunction = getRedditItems
  if (source === 'pushshift') {
    queryFunction = getPushshiftPostsForCommentData
  }
  return queryFunction(Object.keys(link_ids_set))
  .catch(() => { console.error(`Unable to retrieve full titles from ${source}`) })
}

export const applyPostAndParentDataToComment = (postData, comment, applyPostLabels = true) => {
  const post = postData[comment.link_id]
  comment.link_title = post.title
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
    const link_id = ml_item.link_id
    const archive_item = archiveItems[id]
    const modlog = {
      author: ml_item.target_author,
      body: ml_item.target_body,
      link_id,
      created_utc: ml_item.created_utc,
      mod: ml_item.mod,
      details: ml_item.details
    }
    if (archive_item) {
      archive_item.modlog = modlog
    } else {
      archiveItems[id] = {id, link_id, modlog}
    }
  }
}

export const getRevdditCommentsBySubreddit = (subreddit, global) => {
  const {n, before, before_id} = global.state

  global.setLoading('')
  if (subreddit === 'all') {
    subreddit = ''
  }
  const moderators_promise = getModerators(subreddit)
  const subreddit_about_promise = getSubredditAbout(subreddit)
  const modlogs_comments_promise = getModlogsComments(subreddit)
  return getPushshiftCommentsBySubreddit({subreddit, n, before, before_id})
  .catch(error => {return {}}) // if ps is down, can still return modlog results
  .then(pushshiftComments => {
    return modlogs_comments_promise.then(modlogsComments => {
      copyModlogItemsToArchiveItems(modlogsComments, pushshiftComments)
      return pushshiftComments
    })
  })
  .then(pushshiftComments => getRevdditComments({pushshiftComments, subreddit_about_promise}))
  .then(show_comments => {
    return moderators_promise.then(moderators => {
      return global.setSuccess({items: show_comments, moderators})
    })
  })
}

export const modlogSaysBotRemoved = (modlog, item) => {
  return modlog &&
    ((modlog.created_utc - item.created_utc) <= AUTOMOD_LATENCY_THRESHOLD
    || ['automoderator', 'bot'].includes(modlog.mod.toLowerCase()))
}
