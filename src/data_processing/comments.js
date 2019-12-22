import {
  getComments as getRedditComments,
  getItems
} from 'api/reddit'
import {
  getPostsByIDForCommentData as getPushshiftPostsForCommentData,
  getCommentsBySubreddit as getPushshiftCommentsBySubreddit
} from 'api/pushshift'
import { commentIsDeleted, commentIsRemoved } from 'utils'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED,
         UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

export const retrieveRedditComments_and_combineWithPushshiftComments = pushshiftComments => {
  const ids = pushshiftComments.map(comment => comment.id)
  return getRedditComments(ids)
  .then(redditComments => {
    return combinePushshiftAndRedditComments(pushshiftComments, redditComments)
  })
}

export const combinePushshiftAndRedditComments = (pushshiftComments, redditComments) => {
  const ids = pushshiftComments.map(comment => comment.id)
  const pushshiftCommentLookup = {}
  pushshiftComments.forEach(comment => {
    pushshiftCommentLookup[comment.id] = comment
  })
  // Temporary lookup for updating score
  const redditCommentLookup = {}
  redditComments.forEach(comment => {
    redditCommentLookup[comment.id] = comment
    const ps_comment = pushshiftCommentLookup[comment.id]
    if (commentIsRemoved(comment)) {
      ps_comment.removed = true
    } else if (commentIsDeleted(comment)) {
      ps_comment.deleted = true
    }

  })
  const combinedComments = []
  // Replace pushshift data with reddit and mark removedby
  pushshiftComments.forEach(ps_comment => {
    const retrievalLatency = ps_comment.retrieved_on-ps_comment.created_utc
    const redditComment = redditCommentLookup[ps_comment.id]
    ps_comment.name = 't1_'+ps_comment.id // name needed for info page render
    if (redditComment !== undefined) {
      ps_comment.permalink = redditComment.permalink
      ps_comment.link_permalink = redditComment.permalink.split('/').slice(0,6).join('/')+'/'
      if (redditComment.link_title) {
        ps_comment.link_title = redditComment.link_title
      } else {
        ps_comment.link_title = redditComment.permalink.split('/')[5].replace(/_/g, ' ')
      }
      ps_comment.score = redditComment.score
      ps_comment.controversiality = redditComment.controversiality
      ps_comment.stickied = redditComment.stickied
      ps_comment.distinguished = redditComment.distinguished
      ps_comment.locked = redditComment.locked
      ps_comment.replies = []
      if (redditComment.url) {
        ps_comment.url = redditComment.url
      }
      if (typeof(redditComment.num_comments) !== 'undefined') {
        ps_comment.num_comments = redditComment.num_comments
      }
      if ('quarantine' in redditComment) {
        ps_comment.quarantine = redditComment.quarantine
      }
      if ('is_op' in redditComment) {
        ps_comment.is_op = redditComment.is_op
      }
      if (! commentIsRemoved(redditComment)) {
        if (commentIsRemoved(ps_comment)) {
          ps_comment.removedby = AUTOMOD_REMOVED_MOD_APPROVED
        } else {
          ps_comment.removedby = NOT_REMOVED
        }
        ps_comment.author = redditComment.author
        ps_comment.body = redditComment.body
      } else {
        if (commentIsRemoved(ps_comment)) {
          if (retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD) {
            ps_comment.removedby = AUTOMOD_REMOVED
          } else {
            ps_comment.removedby = UNKNOWN_REMOVED
          }
        } else {
          ps_comment.removedby = MOD_OR_AUTOMOD_REMOVED
        }
      }
      combinedComments.push(ps_comment)
    } else {
      // known issue: r/all/comments?before=1538269380 will show some comments whose redditComment has no data
      //              looks like spam that was removed
      //console.log(ps_comment.id)
    }
  })
  console.log(`Pushshift: ${pushshiftComments.length} comments`)
  console.log(`Reddit: ${redditComments.length} comments`)
  return combinedComments

}

// Faster, but missing quarantine field in submissions data
export const getPostDataForCommentsFromPushshift = pushshiftComments => {
  const link_ids_set = {}
  pushshiftComments.forEach(ps_comment => {
    link_ids_set[ps_comment.link_id.slice(3)] = true
  })
  const link_ids = Object.keys(link_ids_set)
  return getPushshiftPostsForCommentData(link_ids)
  .then(ps_posts => {
    return Object.assign(...ps_posts.map(post => ({[post.name]: post})))
  })
  .catch(() => { console.error('Unable to retrieve full titles from Pushshift') })
}

export const getPostDataForComments = ({comments = undefined, link_ids_set = undefined}) => {
  if (! link_ids_set) {
    link_ids_set = {}
    comments.forEach(comment => {
      link_ids_set[comment.link_id] = true
    })
  }
  return getItems(Object.keys(link_ids_set))
  .then(posts => {
    return Object.assign(...posts.map(post => ({[post.name]: post})))
  })
  .catch(() => { console.error('Unable to retrieve full titles from reddit') })
}

//any fields copied/created here should be copied in combinePushshiftAndRedditComments
//so that the comments on /info pages have their post-data carried over
export const applyPostDataToComment = ({postData, comment}) => {
  const postData_thisComment = postData[comment.link_id]
  comment.link_title = postData_thisComment.title
  if (postData_thisComment.url) {
    comment.url = postData_thisComment.url
  }
  if (typeof(postData_thisComment.num_comments) !== 'undefined') {
    comment.num_comments = postData_thisComment.num_comments
  }
  if ('quarantine' in postData_thisComment) {
    comment.quarantine = postData_thisComment.quarantine
  }
  if ('author' in postData_thisComment && postData_thisComment.author === comment.author
      && comment.author !== '[deleted]') {
    comment.is_op = true
  }
}

export const getRevdditComments = (pushshiftComments) => {
  const postDataPromise = getPostDataForComments({comments: pushshiftComments})
  const combinePromise = retrieveRedditComments_and_combineWithPushshiftComments(pushshiftComments)
  return Promise.all([postDataPromise, combinePromise])
  .then(values => {
    const show_comments = []
    const postData = values[0]
    const combinedComments = values[1]
    combinedComments.forEach(comment => {
      if (postData && comment.link_id in postData) {
        const postData_thisComment = postData[comment.link_id]
        if ( ! (postData_thisComment.whitelist_status === 'promo_adult_nsfw' &&
               (comment.removed || comment.deleted))) {
          applyPostDataToComment({postData, comment})
          show_comments.push(comment)
        }
      } else {
        show_comments.push(comment)
      }
    })
    return show_comments
  })
}

export const getRevdditCommentsBySubreddit = (subreddit, global) => {
  const {n, before, before_id} = global.state

  global.setLoading('')
  if (subreddit === 'all') {
    subreddit = ''
  }
  return getPushshiftCommentsBySubreddit({subreddit, n, before, before_id})
  .then(getRevdditComments)
  .then(show_comments => {
    global.setSuccess({items: show_comments})
  })
}
