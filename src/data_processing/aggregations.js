import { getAggregations } from 'api/reveddit'

export const getRevdditAggregations = (subreddit, global, history) => {
  const {content: type, n: limit, sort} = global.state
  return getAggregations({subreddit, type, limit, sort})
  .then(items => global.setSuccess({items}))
}
