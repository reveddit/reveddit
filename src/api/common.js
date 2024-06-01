import Bottleneck from "bottleneck"
import { get, put, getNow, paramString } from 'utils'
import { getModlogsPosts, getModlogsComments } from 'api/reddit'
import { getUmodlogsPosts, getUmodlogsComments } from 'api/reveddit'

const FETCH_CACHE = 'FETCH_CACHE'
const MAX_URLS_IN_CACHE = 30
// {
//   url: {
//     data: ... ,
//     updated: ... ,
//   }
// }
export const fetchWithCache = async (url, options, age) => {
  let fetch_cache = get(FETCH_CACHE, {})
  let url_cache = fetch_cache[url] || {}
  const now = getNow()
  // only fetch data if it's older than age seconds
  if (! url_cache?.updated || (now-url_cache.updated) > age ) {
    url_cache.data = await window.fetch(url, options).then(response => {
      if (! response.ok) {
        // return stale data (or undefined) if fetch fails
        return url_cache.data
      }
      return response.json()
    })
    .catch(() => {
      return url_cache.data
    })
    if (url_cache.data) {
      fetch_cache = Object.entries(fetch_cache)
          .sort(([_akey, a], [_bkey, b]) => b.updated-a.updated)
          .slice(0, MAX_URLS_IN_CACHE-1)
          .reduce((obj, item) => {obj[item[0]] = item[1]; return obj}, {})
      url_cache.updated = now
      // get() again to reduce overwrites caused by simultaneous fetch. Seems to work.
      // Could guarantee no issue by storing data in separate keys, and
      // tracking & deleting old items by using a common key prefix.
      fetch_cache = get(FETCH_CACHE, {})
      fetch_cache[url] = url_cache
      put(FETCH_CACHE, fetch_cache)
    }
  }
  return url_cache.data || {}
}


const reservoir = 50

export const redditLimiter = new Bottleneck({
  reservoir, // 50 requests per minute for add_user calls in threads should keep api usage under 60 requests/minute
  reservoirRefreshAmount: reservoir,
  reservoirRefreshInterval: 60 * 1000, // ms, must be divisible by 250
  maxConcurrent: 10,
})

export const pushshiftLimiter = new Bottleneck({
  reservoir: 1, // 1 request per 1.5 seconds. pushshift allows ??
  reservoirRefreshAmount: 1,
  reservoirRefreshInterval: 1500, // ms, must be divisible by 250
  maxConcurrent: 1,
  minTime: 1000, // How long to wait after launching a job before launching another one.
  // PREVIOUS setup before api delays began @ end of 2022
  // reservoir: 5, // 5 requests per 7 seconds. pushshift allows 60 per minute
  // reservoirRefreshAmount: 5,
  // reservoirRefreshInterval: 7 * 1000, // ms, must be divisible by 250
  // maxConcurrent: 4,
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
  return modlogs[subreddit.toLowerCase()]?.[type]

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
