import {
  getPosts as getPushshiftPosts,
  getRecentCommentsBySubreddit as getPushshiftCommentsBySubreddit,
  getRecentPostsBySubreddit
} from 'api/pushshift'
import { combinePushshiftAndRedditComments } from 'data_processing/comments'

export const getFullTitles = pushshiftComments => {
  const link_ids_set = {}
  pushshiftComments.forEach(ps_comment => {
    link_ids_set[ps_comment.link_id] = true
  })
  const link_ids = Object.keys(link_ids_set)
  return getPushshiftPosts(link_ids)
  .then(ps_posts => {
    return Object.assign(...ps_posts.map(post => ({[post.name]: post})))
  })
  .catch(() => { console.error('Unable to retrieve full titles from Pushshift') })
}


export const getRevdditComments = (subreddit, global) => {
  const gs = global.state

  global.setLoading('Loading comments from Pushshift...')
  return getPushshiftCommentsBySubreddit(subreddit, gs.n, gs.before, gs.before_id)
  .then(pushshiftComments => {
    global.setLoading('Comparing comments to Reddit API...')
    const fullTitlePromise = getFullTitles(pushshiftComments)
    const combinePromise = combinePushshiftAndRedditComments(pushshiftComments)
    return Promise.all([fullTitlePromise, combinePromise])
    .then(values => {
      const show_comments = []
      const full_titles = values[0]
      pushshiftComments.forEach(ps_comment => {
        if (full_titles && ps_comment.link_id in full_titles) {
          if ( ! (full_titles[ps_comment.link_id].whitelist_status === 'promo_adult_nsfw' &&
                 (ps_comment.removed || ps_comment.deleted))) {
            ps_comment.link_title = full_titles[ps_comment.link_id].title
            show_comments.push(ps_comment)
          }
        }
      })
      global.setSuccess({items: show_comments})
      return show_comments
    })
  })
  .catch(global.setError)
}
