import { getAggregations } from 'api/reveddit'
import { getComments, getSubredditAbout } from 'api/reddit'
import { sortCreatedAsc, display_post } from 'utils'

export const getRevdditAggregations = async (subreddit, global) => {
  const {content: type, n: limit, sort} = global.state
  const subredditAbout = await getSubredditAbout(subreddit)
  const over18 = subredditAbout.over18
  if (over18) {
    return global.returnSuccess({over18})
  }
  return getAggregations({subreddit, type, limit, sort})
  .then(temp_items => {
    const items = []
    for (const item of temp_items) {
      display_post(items, item)
    }
    let info_promise = Promise.resolve({})
    if (type === 'comments') {
      const lookup_ids = []
      for (const item of temp_items) {
        if (item.link_id) {
          item.link_id_of_max_pos_removed_item = item.link_id
        } else {
          lookup_ids.push(item.id_of_max_pos_removed_item)
        }
      }
      info_promise = getComments({ids: lookup_ids})
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
      return global.returnSuccess({items, itemsSortedByDate: [...items].sort(sortCreatedAsc), over18: false})
    })
  })
}
