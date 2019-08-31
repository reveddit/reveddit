import {
  getComments as getRedditComments,
  getItems
} from 'api/reddit'
import {
  getPostsByIDForCommentData as getPushshiftPostsForCommentData,
  getCommentsBySubreddit as getPushshiftCommentsBySubreddit,
  getRecentPostsBySubreddit
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
      ps_comment.link_title = redditComment.permalink.split('/')[5].replace(/_/g, ' ')
      ps_comment.score = redditComment.score
      ps_comment.controversiality = redditComment.controversiality
      ps_comment.stickied = redditComment.stickied
      ps_comment.distinguished = redditComment.distinguished
      ps_comment.replies = []
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
export const getFullTitlesFromPushshift = pushshiftComments => {
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

export const getFullTitles = pushshiftComments => {
  const link_ids_set = {}
  pushshiftComments.forEach(ps_comment => {
    link_ids_set[ps_comment.link_id] = true
  })
  const link_ids = Object.keys(link_ids_set)
  return getItems(link_ids)
  .then(posts => {
    return Object.assign(...posts.map(post => ({[post.name]: post})))
  })
  .catch(() => { console.error('Unable to retrieve full titles from reddit') })
}


export const getRevdditComments = (pushshiftComments) => {
  const fullTitlePromise = getFullTitles(pushshiftComments)
  const combinePromise = retrieveRedditComments_and_combineWithPushshiftComments(pushshiftComments)
  return Promise.all([fullTitlePromise, combinePromise])
  .then(values => {
    const show_comments = []
    const full_titles = values[0]
    const combinedComments = values[1]
    combinedComments.forEach(comment => {
      if (full_titles && comment.link_id in full_titles) {
        const full_post_data = full_titles[comment.link_id]
        if ( ! (full_post_data.whitelist_status === 'promo_adult_nsfw' &&
               (comment.removed || comment.deleted))) {
          comment.link_title = full_post_data.title
          if (full_post_data.url) {
            comment.url = full_post_data.url
          }
          if (typeof(full_post_data.num_comments) !== 'undefined') {
            comment.num_comments = full_post_data.num_comments
          }
          if ('quarantine' in full_post_data) {
            comment.quarantine = full_post_data.quarantine
          }
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
  const gs = global.state

  global.setLoading('')
  if (subreddit === 'all') {
    subreddit = ''
  }
  return getPushshiftCommentsBySubreddit(subreddit, gs.n, gs.before, gs.before_id)
  .then(getRevdditComments)
  .then(show_comments => {
    global.setSuccess({items: show_comments})
  })
}
