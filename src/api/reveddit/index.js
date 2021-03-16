import { paramString, SimpleURLSearchParams, PATH_STR_SUB } from 'utils'
import { mapRedditObj } from 'api/reddit'
import { urlParamKeys, removedFilter_types, localSort_types } from 'state'
import { AUTOMOD_REMOVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED } from 'pages/common/RemovedBy'

const errorHandler = (e) => {
  throw new Error(`Could not connect to Reveddit: ${e}`)
}

// cf cache is 2 hours, make the period longer than that
const period_in_minutes = 300
const period_in_seconds = period_in_minutes * 60
// increment the count every `seconds_until_increment` seconds
const DEFAULT_SECONDS_UNTIL_INCREMENT = 60
const offset = (new Date()).getTimezoneOffset()*60*1000

const getCount = (seconds_until_increment = DEFAULT_SECONDS_UNTIL_INCREMENT) => {
  const date = new Date()
  //normalize hours across timezones
  date.setTime(date.getTime()+offset)
  const seconds_since_day_began = date.getHours()*60*60+date.getMinutes()*60+date.getSeconds()
  const seconds_since_beginning_of_current_period = seconds_since_day_began-Math.floor(seconds_since_day_began/(period_in_seconds))*period_in_seconds
  const count_within_period = Math.floor(seconds_since_beginning_of_current_period / seconds_until_increment)
  return 'mxc'+count_within_period.toString(36)
}

export const getMissingComments = async ({subreddit, limit=100, page=1}) => {
  const params = {
    ...(subreddit && {subreddit}),
    limit,
    ...(page && {page}),
    c: getCount()
  }
  return flaskQuery('missing-comments/get/?', params)
}

export const submitMissingComments = async (ids) => {
  const params = {
    ids: ids.join(','),
    c: getCount()
  }
  return flaskQuery('missing-comments/post/?', params)
}

export const getWhatPeopleSay = async () => {
  const params = {
    c: getCount()
  }
  return flaskQuery('what-people-say/?', params, REVEDDIT_FLASK_HOST_LONG)
}

export const getArchiveTimes = async () => {
  const params = {
    c: getCount(120)
  }
  return flaskQuery('archive-times/?', params)
}

const aggregationsPath = 'aggregations/?'

//default values for aggregations query via r/subreddit/top
export const agg_defaults_for_page = {
  limit: 100,
  sort: 'top',
  type: 'comments',
}

export const getAggregations = ({subreddit, type = agg_defaults_for_page.type, limit = agg_defaults_for_page.limit, sort = agg_defaults_for_page.sort}) => {
  return flaskQuery(aggregationsPath, {type, subreddit, limit, sort}, REVEDDIT_FLASK_HOST_LONG)
}

export const getAggregationsURL = ({subreddit, type = agg_defaults_for_page.type, limit = agg_defaults_for_page.limit, sort = agg_defaults_for_page.sort}) => {
  return REVEDDIT_FLASK_HOST_LONG + aggregationsPath + paramString({type, subreddit, limit, sort})
}

export const numGraphPointsParamKey = 'rr_ngp'
export const sortByParamKey = 'rr_sortby'
export const contentTypeParamKey = 'rr_content'

//default values for aggregations query via the "Removal Rate" graph
export const aggregationPeriodParams = {
  [numGraphPointsParamKey]: 50,
  [sortByParamKey]: agg_defaults_for_page.sort,
  [contentTypeParamKey]: agg_defaults_for_page.type,
}

export const getAggregationsPeriodURL = ({subreddit, type, numGraphPoints, limit, sort, last_created_utc: before, last_id: before_id}) => {
  const queryParams = new SimpleURLSearchParams()
  const translatedParams = {
    //these params describe how data will be queried
    [contentTypeParamKey]: type,
    [sortByParamKey]: sort,
    [numGraphPointsParamKey]: numGraphPoints,
    [urlParamKeys.before]: before,
    [urlParamKeys.before_id]: before_id,
    [urlParamKeys.n]: limit,
    //below params describe how the loaded page will be filtered/sorted
    [urlParamKeys.removedFilter]: removedFilter_types.removed,
    [urlParamKeys.localSort]: localSort_types.score,
    [urlParamKeys.removedByFilter]: [MOD_OR_AUTOMOD_REMOVED, AUTOMOD_REMOVED, UNKNOWN_REMOVED].join(','),
  }
  Object.keys(translatedParams).forEach(param => {
    //For params that have default values, only set param if value is not the default
    //Set all other params
    if (! (param in aggregationPeriodParams) || translatedParams[param] != aggregationPeriodParams[param]) {
      queryParams.set(param, translatedParams[param])
    }
  })
  const commentsPath = type === 'comments' ? 'comments/' : ''
  return `${PATH_STR_SUB}/${subreddit}/`+commentsPath+queryParams.toString()
}

const flaskQuery = (path, params = {}, host = REVEDDIT_FLASK_HOST_SHORT) => {
  const url = host + path + paramString(params)
  return window.fetch(url)
  .then(response => response.json())
  .catch(errorHandler)
}
