import { getAggregations } from 'api/reveddit'
import { getComments, getSubredditAbout } from 'api/reddit'
import { sortCreatedAsc, display_post } from 'utils'

export const getRevdditAggregations = async (subreddit, global) => {
  const {content: type, n: limit, sort, before, after, rate_less, rate_more} = global.state
  const subredditAbout = await getSubredditAbout(subreddit)
  const over18 = subredditAbout.over18
  if (over18) {
    return global.returnSuccess({over18})
  }
  return getAggregations({subreddit, type, limit, sort, before, after, rate_less, rate_more})
  .then(({data: temp_items, meta}) => {
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
      let rate_least, rate_most, oldestTimestamp, newestTimestamp
      for (const i of items) {
        i.created_utc = i.last_created_utc
        if (rate_least == undefined || i.rate < rate_least) {
          rate_least = i.rate
        }
        if (rate_most == undefined || i.rate > rate_most) {
          rate_most = i.rate
        }
        if (oldestTimestamp == undefined || i.last_created_utc < oldestTimestamp) {
          oldestTimestamp = i.last_created_utc
        }
        if (newestTimestamp == undefined || i.last_created_utc > newestTimestamp) {
          newestTimestamp = i.last_created_utc
        }
      }
      return global.returnSuccess({
        agg_most_recent_created_utc: meta.most_recent_created_utc,
        items,
        itemsSortedByDate: [...items].sort(sortCreatedAsc),
        over18: false,
        rate_least, rate_most,
        oldestTimestamp, newestTimestamp,
      })
    })
  })
}
