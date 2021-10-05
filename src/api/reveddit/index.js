import { paramString, SimpleURLSearchParams, PATH_STR_SUB } from 'utils'
import { mapRedditObj, getModeratorsPostProcess, flaskQuery,
         getCount, subredditHasModlogs,
         U_MODLOGS_CODE,
} from 'api/common'
import { urlParamKeys, removedFilter_types, localSort_types } from 'state'
import { AUTOMOD_REMOVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED } from 'pages/common/RemovedBy'

const ARCHIVE_MAX_SIZE = 250

export const getMissingComments = async ({subreddit, limit=100, page=1}) => {
  const params = {
    ...(subreddit && {subreddit}),
    limit,
    ...(page && {page}),
    c: getCount()
  }
  return flaskQuery({path: 'missing-comments/get/', params})
}

export const submitMissingComments = async (ids) => {
  const params = {
    ids: ids.join(','),
    c: getCount()
  }
  return flaskQuery({path: 'missing-comments/post/', params})
}

export const getWhatPeopleSay = async () => {
  const params = {
    c: getCount()
  }
  return flaskQuery({path: 'what-people-say/', params, host: REVEDDIT_FLASK_HOST_LONG})
}

export const getArchiveTimes = async () => {
  const params = {
    c: getCount(120)
  }
  return flaskQuery({path: 'archive-times/', params})
}

const aggregationsPath = 'aggregations/'

//default values for aggregations query via r/subreddit/history
export const agg_defaults_for_page = {
  limit: 100,
  sort: 'top',
  type: 'comments',
}

export const getAggregations = ({subreddit, type = agg_defaults_for_page.type, limit = agg_defaults_for_page.limit, sort = agg_defaults_for_page.sort}) => {
  return flaskQuery({path: aggregationsPath, params: {type, subreddit, limit, sort}, host: REVEDDIT_FLASK_HOST_LONG})
}

export const getAggregationsURL = ({subreddit, type = agg_defaults_for_page.type, limit = agg_defaults_for_page.limit, sort = agg_defaults_for_page.sort}) => {
  return REVEDDIT_FLASK_HOST_SHORT + aggregationsPath + '?' + paramString({type, subreddit, limit, sort})
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

export const getUmodlogsThread = (subreddit, thread_id) => {
  return getUmodlogs({subreddit, thread_id, actions:'approvelink,removelink,spamlink,removecomment,spamcomment'})
}
export const getUmodlogsPosts = (subreddit) => {
  return getUmodlogs({subreddit, actions:'removelink,spamlink'})
  .then(r => r.posts)
}
export const getUmodlogsComments = (subreddit) => {
  return getUmodlogs({subreddit, actions:'removecomment,spamcomment'})
  .then(r => r.comments)
}
export const getUmodlogs = async ({subreddit, thread_id, actions}) => {
  const empty = {comments: {}, posts: {}}
  const hasModlogs = await subredditHasModlogs(subreddit, U_MODLOGS_CODE)
  if (hasModlogs) {
    const params = { c: getCount(), limit: 100 }
    if (thread_id) {
      params.link = `/r/comments/${thread_id}`
    }
    params.actions = actions
    return flaskQuery({path: `r/${subreddit}/logs/`, params, host: U_MODLOGS_API})
    .then(result => postProcessUmodlogs(result.logs, thread_id))
  }
  return empty
}

const postProcessUmodlogs = (list, thread_id) => {
  const comments = {}, posts = {}
  for (const item of list) {
    if (thread_id && thread_id !== item.submissionId) {
      continue
    }
    item.log_source = 'u_modlogs'
    item.id = item.commentId || item.submissionId
    item.target_author = item.author || ''
    item.target_body = item.content || ''
    item.target_permalink = item.link || ''
    item.created_utc = Math.floor(item.timestamp/1000) || 0
    item.link_id = 't3_'+item.submissionId
    item.details = ((item.details || '') + ' ' + (item.automodActionReason || '')).trim()
    item.mod = item.mod || ''
    if (item.isComment) {
      comments[item.id] = item
    } else {
      posts[item.id] = item
    }
  }
  return {comments, posts}
}

export const getModerators = (subreddit) => {
  return flaskQuery({path: 'moderators/', params: {subreddit}})
  .catch(error => {return {}}) // ignore fetch errors, this is not critical data
  .then(getModeratorsPostProcess)
}

export const getCommentsByThread = (link_id, after, root_comment_id, comment_id) => {
  const params = {
    link_id,
    ...(after && {after}),
    ...(root_comment_id && {root_comment_id}),
    ...(comment_id && {comment_id}),
    c: getCount(150),
  }
  return flaskQuery({path: 'thread-comments/', params, options: extendedTimeout})
  .catch(error => {return {}}) // ignore fetch errors, this is not critical data
}


export const getRemovedCommentsByThread = (link_id, after, root_comment_id, comment_id) => {
  return Promise.all([
    getRemovedCommentsByThread_v1(link_id, after, root_comment_id, comment_id),
    getRemainingCommentsByThread(link_id, after, root_comment_id),
  ])
  .then(results => Object.assign({}, ...results))
}

const extendedTimeout = { timeout: 12000 }

export const getRemovedCommentsByThread_v1 = (link_id, after, root_comment_id, comment_id) => {
  const params = {
    link_id,
    ...(after && {after}),
    ...(root_comment_id && {root_comment_id}),
    ...(comment_id && {comment_id}),
    c: getCount(600),
  }
  return flaskQuery({path: 'removed-comments/', params, options: extendedTimeout})
  .catch(error => {return {}}) // ignore fetch errors, this is not critical data
}

export const getRemainingCommentsByThread = async (link_id, after, root_comment_id) => {
  const params = {
    link_id,
    ...(after && {after}),
    ...(root_comment_id && {root_comment_id}),
    c: getCount(1200),
  }
  return {}
  return flaskQuery({path: 'linkid-comments/', params})
  .catch(error => {return {}}) // ignore fetch errors, this is not critical data
}

export const getArchivedCommentsByID = (ids) => {
  const params = {
    ids: ids.slice(0, ARCHIVE_MAX_SIZE),
  }
  return flaskQuery({path: 'comments-by-id/', params, options: extendedTimeout})
  .catch(error => {return {}}) // ignore fetch errors, this is not critical data
}

// using REVEDDIT_FLASK_HOST_SHORT b/c wayback results will change for recent data
export const getWaybackComments = (path, ids) => {
  return flaskQuery({path: 'wayback/', params: {path, ids}})
}
