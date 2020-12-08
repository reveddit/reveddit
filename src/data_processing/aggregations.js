import { getAggregations } from 'api/reveddit'
import { getComments } from 'api/reddit'

export const getRevdditAggregations = (subreddit, global, history) => {
  const {content: type, n: limit, sort} = global.state
  return getAggregations({subreddit, type, limit, sort})
  .then(items => {
    let info_promise = Promise.resolve({})
    if (type === 'comments') {
      info_promise = getComments({ids: items.map(x => x.id_of_max_pos_removed_item)})
    }
    info_promise.then(comments => {
      if (Object.keys(comments).length) {
        for (const c of items) {
          const reddit_comment = comments[c.id_of_max_pos_removed_item]
          if (reddit_comment) {
            c.link_id_of_max_pos_removed_item = reddit_comment.link_id.substr(3)
          }
        }
      }
      global.setSuccess({items})
    })
  })
}
