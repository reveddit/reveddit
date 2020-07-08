import { paramString } from 'utils'
import { mapRedditObj, getDate } from 'api/reddit'

const errorHandler = (e) => {
  throw new Error(`Could not connect to Reveddit: ${e}`)
}

// cf cache is 2 hours, using 2.5 just in case
const period_in_minutes = 150
const period_in_seconds = period_in_minutes * 60
// increment the count every `seconds_until_increment` seconds
const DEFAULT_SECONDS_UNTIL_INCREMENT = 60

const getCount = async (date, seconds_until_increment = DEFAULT_SECONDS_UNTIL_INCREMENT) => {
  if (! date) {
    const created_utc = await getDate()
    date = new Date(created_utc * 1000)
  }
  const seconds_since_day_began = date.getHours()*60*60+date.getMinutes()*60+date.getSeconds()
  const seconds_since_beginning_of_current_period = seconds_since_day_began-Math.floor(seconds_since_day_began/(period_in_seconds))*period_in_seconds
  const count_within_period = Math.floor(seconds_since_beginning_of_current_period / seconds_until_increment)
  return count_within_period
}

export const getMissingComments = async ({subreddit, limit=100, page=1}) => {
  const params = {
    ...(subreddit && {subreddit}),
    limit,
    ...(page && {page}),
    c: await getCount(new Date())
  }
  return flaskQuery('missing-comments/get/?', params)
}

export const submitMissingComments = async (ids) => {
  const params = {
    ids: ids.join(','),
    c: await getCount(new Date())
  }
  return flaskQuery('missing-comments/post/?', params)
}

export const getWhatPeopleSay = async () => {
  const params = {
    c: await getCount(new Date())
  }
  return flaskQuery('what-people-say/?', params)
}

export const getArchiveTimes = async () => {
  const params = {
    c: await getCount(null, 120)
  }
  return flaskQuery('archive-times/?', params)
}

export const flaskQuery = (path, params = {}) => {
  const url = REVEDDIT_FLASK_HOST + path + paramString(params)
  return window.fetch(url)
  .then(response => response.json())
  .catch(errorHandler)
}
