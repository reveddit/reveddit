import { isCommentID, isPostID } from 'utils'
import {
  getItems as getRedditItemsByID
} from 'api/reddit'
import {
  getPosts as getPushshiftPosts,
  chunkAnd_getCommentsByID as getPushshiftComments
} from 'api/pushshift'
import { combinePushshiftAndRedditComments } from 'data_processing/comments'
import { combinePushshiftAndRedditPosts } from 'data_processing/posts'


export const getRevdditItems = (global, history) => {
  const gs = global.state
  global.setLoading('')
  const ids = decodeURI(gs.id).replace(/ /g,'').split(',')
  const postIDs_full = [], commentIDs_short = []
  ids.forEach(id => {
    if (isCommentID(id)) commentIDs_short.push(id.slice(3))
    else if (isPostID(id)) postIDs_full.push(id)
  })

  // query PS twice, reddit in chunks, all at the same time
  const promises = [getRedditItemsByID(ids),
                    getPushshiftComments(commentIDs_short),
                    getPushshiftPosts(postIDs_full)]
  return Promise.all(promises)
  .then(result => {
    const redditItems = result[0]
    const pushshiftComments = result[1]
    const pushshiftPosts = result[2]
    const redditComments = []
    const redditPosts = []
    redditItems.forEach(item => {
      if (isCommentID(item.name)) redditComments.push(item)
      else if (isPostID(item.name)) redditPosts.push(item)
    })

    combinePushshiftAndRedditComments(pushshiftComments, redditComments)
    const combinedPosts = combinePushshiftAndRedditPosts(pushshiftPosts, redditPosts)
    global.setSuccess({items: pushshiftComments.concat(combinedPosts)})
  })
}
