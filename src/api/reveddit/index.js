import { paramString } from 'utils'
import { mapRedditObj } from 'api/reddit'

const errorHandler = (e) => {
  throw new Error(`Could not connect to Reveddit: ${e}`)
}

// cf cache is 2 hours, using 2.5 just in case
const period_in_minutes = 150
const period_in_seconds = period_in_minutes * 60
// increment the count every `seconds_until_increment` seconds
const DEFAULT_SECONDS_UNTIL_INCREMENT = 60

const getCount = (seconds_until_increment = DEFAULT_SECONDS_UNTIL_INCREMENT) => {
  const d = new Date()
  const seconds_since_day_began = d.getHours()*60*60+d.getMinutes()*60+d.getSeconds()
  const seconds_since_beginning_of_current_period = seconds_since_day_began-Math.floor(seconds_since_day_began/(period_in_seconds))*period_in_seconds
  const count_within_period = Math.floor(seconds_since_beginning_of_current_period / seconds_until_increment)
  return count_within_period
}

export const getMissingComments = ({subreddit, limit=100, page=1}) => {
  const params = {
    ...(subreddit && {subreddit}),
    limit,
    ...(page && {page}),
    c: getCount()
  }
  return flaskQuery('missing-comments/get/?', params)
}

export const submitMissingComments = (ids) => {
  const params = {
    ids: ids.join(','),
    c: getCount()
  }
  return flaskQuery('missing-comments/post/?', params)
}

export const getWhatPeopleSay = () => {
  const params = {
    c: getCount()
  }
  return flaskQuery('what-people-say/?', params)
}

export const getArchiveTimes = () => {
  const params = {
    c: getCount(120)
  }
  return flaskQuery('archive-times/?', params)
}

export const flaskQuery = (path, params = {}) => {
  const url = REVEDDIT_FLASK_HOST + path + paramString(params)
  return window.fetch(url)
  .then(response => response.json())
  .catch(errorHandler)
}
