import {
  getComments as getRedditComments
} from 'api/reddit'
import { getMissingComments } from 'api/reveddit'
import {
  getPostDataForComments,
  applyPostAndParentDataToComment,
  combinePushshiftAndRedditComments,
  set_link_permalink
} from 'data_processing/comments'
import { setPostAndParentDataForComments } from 'data_processing/info'

const maxN = 100
export const getRevdditMissingComments = (subreddit, global) => {
  const {page, n} = global.state

  global.setLoading('')
  if (subreddit === 'all') {
    subreddit = ''
  }
  let limit = n
  if (n && n > maxN) {
    limit = maxN
  }
  return getMissingComments({subreddit, limit, page})
  .then(({comments: missingComments, meta: missingCommentsMeta}) => {
    const postDataPromise = getPostDataForComments({comments: missingComments})
    const redditCommentsPromise = getRedditComments({objects: missingComments})
    return Promise.all([postDataPromise, redditCommentsPromise])
    .then(([postData, redditComments]) => {
      const combinedComments_array = Object.values(combinePushshiftAndRedditComments({}, redditComments, false))
      for (const c of combinedComments_array) {
        c.missing_in_thread = true
        c.observed_utc = missingComments[c.id].observed_utc
        set_link_permalink(c, c)
        if (c.parent_id.slice(0,2) === 't1') {
          c.parent_context = c.link_permalink + c.parent_id.slice(3) + '/'
        } else {
          c.parent_context = c.link_permalink
        }
      }
      setPostAndParentDataForComments(combinedComments_array, postData)
      return global.setSuccess({items: combinedComments_array, paginationMeta: missingCommentsMeta})
    })
  })
}