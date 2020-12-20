import { getAggregations } from 'api/reveddit'
import { getComments } from 'api/reddit'
import { sortCreatedAsc } from 'utils'

export const getRevdditAggregations = (subreddit, global, history) => {
  const {content: type, n: limit, sort} = global.state
  return getAggregations({subreddit, type, limit, sort})
  .then(items => {
    let info_promise = Promise.resolve({})
    if (type === 'comments') {
      info_promise = getComments({ids: items.map(x => x.id_of_max_pos_removed_item)})
    }
    return info_promise.then(comments => {
      //post processing for comments
      if (Object.keys(comments).length) {
        for (const c of items) {
          const reddit_comment = comments[c.id_of_max_pos_removed_item]
          if (reddit_comment) {
            c.link_id_of_max_pos_removed_item = reddit_comment.link_id.substr(3)
          }
        }
      }
      return comments
    })
    .then(() => {
      //post processing for all items
      for (const i of items) {
        i.created_utc = i.last_created_utc
      }
      return global.setSuccess({items, itemsSortedByDate: [...items].sort(sortCreatedAsc)})
    })
  })
}
