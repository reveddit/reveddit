import {
  getComments as getRedditComments
} from 'api/reddit'
import { getMissingComments } from 'api/reveddit'
import {
  getPostDataForComments,
  applyPostAndParentDataToComment,
  combinePushshiftAndRedditComments,
  set_link_permalink,
  setSubredditMeta,
} from 'data_processing/comments'
import { setPostAndParentDataForComments } from 'data_processing/info'
import { sortCreatedAsc } from 'utils'

const maxN = 100
export const getRevdditMissingComments = async (subreddit, global) => {
  const {page, n, quarantined} = global.state
  let quarantined_subreddits
  if (subreddit === 'all') {
    subreddit = ''
  } else {
    await setSubredditMeta(subreddit, global)
    if (quarantined) {
      quarantined_subreddits = subreddit
    }
  }
  let limit = n
  if (n && n > maxN) {
    limit = maxN
  }
  return getMissingComments({subreddit, limit, page})
  .then(({comments: missingComments, meta: missingCommentsMeta}) => {
    const postDataPromise = getPostDataForComments({comments: missingComments, quarantined_subreddits})
    const redditCommentsPromise = getRedditComments({ids: Object.keys(missingComments), quarantined_subreddits})
    return Promise.all([postDataPromise, redditCommentsPromise])
    .then(([postData, redditComments]) => {
      const combinedComments_array = Object.values(combinePushshiftAndRedditComments({}, redditComments, false))
      for (const c of combinedComments_array) {
        setMissingCommentMeta(c, missingComments)
      }
      setPostAndParentDataForComments(combinedComments_array, postData)
      combinedComments_array.sort(sortCreatedAsc)
      return global.returnSuccess({items: combinedComments_array,
                                itemsSortedByDate: combinedComments_array,
                                paginationMeta: missingCommentsMeta})
    })
  })
}

export const setMissingCommentMeta = (c, missingComments) => {
  c.missing_in_thread = true
  c.observed_utc = missingComments[c.id].observed_utc
  set_link_permalink(c, c)
  if (c.parent_id.slice(0,2) === 't1') {
    c.parent_context = c.link_permalink + c.parent_id.slice(3) + '/'
  } else {
    c.parent_context = c.link_permalink
  }
}
