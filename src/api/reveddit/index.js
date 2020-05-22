import { paramString } from 'utils'

const errorHandler = (e) => {
  throw new Error(`Could not connect to Reveddit: ${e}`)
}

// cf cache is 2 hours, using 2.5 just in case
const period_in_minutes = 150
const period_in_seconds = period_in_minutes * 60
// increment the count every `seconds_until_increment` seconds
const seconds_until_increment = 60

const getCount = () => {
  const d = new Date()
  const seconds_since_day_began = d.getHours()*60*60+d.getMinutes()*60+d.getSeconds()
  const seconds_since_beginning_of_current_period = seconds_since_day_began-Math.floor(seconds_since_day_began/(period_in_seconds))*period_in_seconds
  const count_within_period = Math.floor(seconds_since_beginning_of_current_period / seconds_until_increment)
  return count_within_period
}

export const getMissingComments = ({subreddit, limit=100, before_id}) => {
  const params = {
    ...(subreddit && {subreddit}),
    limit,
    ...(before_id && {before_id}),
    c: getCount()
  }
  const url = REVEDDIT_MISSING_COMMENTS_HOST + 'missing-comments/get/?' + paramString(params)
  return window.fetch(url)
  .then(response => response.json())
  .catch(errorHandler)
}

export const submitMissingComments = (ids) => {
  const params = {
    ids: ids.join(','),
    c: getCount()
  }
  const url = REVEDDIT_MISSING_COMMENTS_HOST + 'missing-comments/post/?' + paramString(params)
  return window.fetch(url)
  .then(response => response.json())
  .catch(errorHandler)
}
