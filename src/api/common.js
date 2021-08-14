import Bottleneck from "bottleneck"
import { get, put, getNow, paramString } from 'utils'
import { getModlogsPosts, getModlogsComments } from 'api/reddit'
import { getUmodlogsPosts, getUmodlogsComments } from 'api/reveddit'

export const redditLimiter = new Bottleneck({
  reservoir: 30, // 30 requests per minute for add_user calls in threads should keep api usage under 60 requests/minute
  reservoirRefreshAmount: 30,
  reservoirRefreshInterval: 60 * 1000, // ms, must be divisible by 250
  maxConcurrent: 10,
})

export const mapRedditObj = (map, obj, key = 'name') => (map[obj.data[key]] = obj.data, map)

export const getModeratorsPostProcess = (results) => {
  if (results.reason === 'quarantined') {
    throw results
  }
  if (results.data) {
    return results.data.children.reduce((map, obj) => (map[obj.name] = true, map), {})
  } else {
    return results
  }
}

export const revedditErrorHandler = (e) => {
  throw new Error(`Could not connect to Reveddit: ${e}`)
}


// cf cache is 2 hours, make the period longer than that
const period_in_minutes = 300
const period_in_seconds = period_in_minutes * 60
// increment the count every `seconds_until_increment` seconds
const DEFAULT_SECONDS_UNTIL_INCREMENT = 60
const offset = (new Date()).getTimezoneOffset()*60*1000

export const getCount = (seconds_until_increment = DEFAULT_SECONDS_UNTIL_INCREMENT) => {
  const date = new Date()
  //normalize hours across timezones
  date.setTime(date.getTime()+offset)
  const seconds_since_day_began = date.getHours()*60*60+date.getMinutes()*60+date.getSeconds()
  const seconds_since_beginning_of_current_period = seconds_since_day_began-Math.floor(seconds_since_day_began/(period_in_seconds))*period_in_seconds
  const count_within_period = Math.floor(seconds_since_beginning_of_current_period / seconds_until_increment)
  return 'mxc'+count_within_period.toString(36)
}

export const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 8000 } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  })
  clearTimeout(id)

  return response
}

export const flaskQuery = ({path, params = {}, host = REVEDDIT_FLASK_HOST_SHORT, options}) => {
  const param_str = (params && Object.keys(params).length) ? '?' + paramString(params) : ''
  const url = host + path + param_str
  return fetchWithTimeout(url, options)
  .then(response => response.json())
  .catch(revedditErrorHandler)
}

const MODLOGS_SUBREDDITS = 'modlogs-subreddits'
export const U_PUBLICMODLOGS_CODE = 'pml'
export const U_MODLOGS_CODE = 'ml'
export const ALL_MODLOGS_CODES = [U_PUBLICMODLOGS_CODE, U_MODLOGS_CODE]

export const subredditHasModlogs = async (subreddit, type) => {
  if (! ALL_MODLOGS_CODES.includes(type)) {
    console.error('bad modlogs code', type)
    return false
  }
  const modlogs = await getAllSubredditsWithModlogs()
  return modlogs[subreddit]?.[type]

}

export const getAllSubredditsWithModlogs = async () => {
  let modlogsStorage = get(MODLOGS_SUBREDDITS, {data: {}})
  const now = getNow()
  // only fetch modlogs-subreddits data if it's older than 10 minutes
  if (! modlogsStorage || ! modlogsStorage.updated || (now-modlogsStorage.updated) > 60*10 ) {
    const data = await flaskQuery({path: 'modlogs-subreddits/', params: { c: getCount() }})
    .catch(() => undefined)
    if (data) {
      modlogsStorage = {data, updated: now}
      put(MODLOGS_SUBREDDITS, modlogsStorage)
    }
  }
  return modlogsStorage.data
}

export const getModlogsPromises = async (subreddit, type = 'comments') => {
  await getAllSubredditsWithModlogs() // cache the result prior to two function calls below. Saves 1 duplicate query
  if (type === 'comments') {
    return [getModlogsComments({subreddit, limit:100}), getUmodlogsComments(subreddit)]
  } else {
    return [getModlogsPosts({subreddit}), getUmodlogsPosts(subreddit)]
  }
}
