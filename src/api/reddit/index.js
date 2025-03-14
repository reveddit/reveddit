import { chunk, promiseDelay,
         getRandomInt, paramString, getCustomClientID,
} from 'utils'
import { getAuth } from './auth'
import { mapRedditObj,
         subredditHasModlogs, U_PUBLICMODLOGS_CODE, fetchWithCache,
         redditLimiter
} from 'api/common'
import { getModerators } from 'api/reveddit'

const https = 'https://'
export const oauth_reddit = https+'oauth.reddit.com/'
let can_use_oauth_reddit_rev = true
export const www_reddit = https+'www.reddit.com'
export const www_reddit_slash = www_reddit + '/'
export const old_reddit = https+'old.reddit.com'

const u_publicmodlogs_feed = '7e9b27126097f51ae6c9cd5b049af34891da6ba6'
const numRequestsBeforeWait = 100
const waitInterval = 5000
const maxNumItems = 100
const commentSortOptions = ['confidence', 'new', 'controversial', 'old', 'qa']
const MIN_COMMENT_KARMA = 1000


const errorHandler = (e) => {
  throw new Error(`Could not connect to Reddit: ${e}`)
}

export const getComments = ({objects = undefined, ids = [], quarantined_subreddits, useProxy = false}) => {
  const full_ids = getFullIDsForObjects(objects, ids, 't1_')
  return getItems({ids: full_ids, quarantined_subreddits, key: 'id', useProxy})
}

export const getPosts = ({objects = undefined, ids = [], quarantined_subreddits, useProxy = false}) => {
  const full_ids = getFullIDsForObjects(objects, ids, 't3_')
  return getItems({ids: full_ids, quarantined_subreddits, key: 'id', useProxy})
  .then(posts => {
    for (const p of Object.values(posts)) {
      p.url = p.url || ''
      p.domain = p.domain || ''
    }
    return posts
  })
}

export const getModeratedSubreddits = async (user) => {
  const host = www_reddit_slash
  const url = host + `user/${user}/moderated_subreddits/.json`
  const auth = await getAuth(host)
  return fetchWithCache(url, auth, 60*30)
  .then(results => {
    return (results.data || []).reduce((map, obj) => (map[obj.sr.toLowerCase()] = true, map), {['u_'+user]: true})
  })
}

export const getUserAbout = async (user) => {
  const host = www_reddit_slash
  const url = host + `user/${user}/about/.json`
  const auth = await getAuth(host)
  return fetchWithCache(url, auth, 60*60*24)
  .then(data => data.data)
}

export const getSubredditAbout = (subreddit, useProxy = false) => {
  const host = getHost(useProxy)
  const url = host + `r/${subreddit}/about/.json`
  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(response => response.json())
  .catch(error => {return {}})
  .then(results => {
    if (results.reason === 'quarantined') {
      throw results
    }
    return results.data || results
  })
}

export const getPostsForURLs = async (urls, auth = null) => {
  const results = {}
  if (! auth) {
    auth = await getAuth()
  }
  return groupRequests(getPostsByURL, urls, [auth, results], 1)
  .then(res => results)
  .catch(errorHandler)
}

const getPostsByURL = (urlParam, auth = null, results) => {
  const params = {url: encodeURIComponent(urlParam), raw_json:1, limit:100}
  const url = oauth_reddit + 'api/info' + '?'+paramString(params)
  return query(url, auth, 'id', results)
  .catch(errorHandler)
}

const getFullIDsForObjects = (objects, ids, prefix) => {
  let full_ids = []
  if (typeof(objects) === 'object') {
    if (Array.isArray(objects)) {
      full_ids = objects.map(o => prefix+o.id)
    } else {
      full_ids = Object.values(objects).map(o => prefix+o.id)
    }
  } else {
    full_ids = ids.map(id => prefix+id)
  }
  return full_ids
}

export const getItems = async ({ids, quarantined_subreddits, key = 'name', useProxy = false}) => {
  const results = {}
  if (! ids.length) {
    return results
  }
  if (quarantined_subreddits) {
    useProxy = true
  }
  const host = getHost(useProxy)
  await getAuth()
  return groupRequests(queryByID, ids, [quarantined_subreddits, key, results, host], maxNumItems)
  .then(() => {
    return results
  })
}

const groupRequests = async (func, items, params, localMaxNumItems) => {
  const promises = []
  let i = 0
  for (let items_chunk of chunk(items, localMaxNumItems)) {
    if (i > 0 && i % numRequestsBeforeWait === 0) {
      await promiseDelay(waitInterval)
    }
    if (localMaxNumItems == 1) {
      items_chunk = items_chunk[0]
    }
    promises.push(func(items_chunk, ...params))
    i += 1
  }
  return Promise.all(promises)
}

export const getPostWithComments = ({
  threadID, commentID: comment, context = 0, sort = 'old', limit=500, useProxy = false,
  subreddit,
}) => {
  const params = {
    limit,
    sort,
    depth: 10,
    threaded: false,
    showmore: true,
    ...(comment && {comment}),
    ...(context && {context})
  }
  const thisQueryParams = {
    ...params,
    subreddit: subreddit,
  }
  const host = getHost(useProxy)
  if (host === OAUTH_REDDIT_REV && subreddit) {
    params.quarantined_subreddits = subreddit
  }
  const url = host + `comments/${threadID}.json`+'?'+paramString(params)
  return getAuth(host)
    .then(auth => fetchJsonAndValidate(url, auth))
    .then(results => {
      if (! Array.isArray(results)) {
        throw results
      }
      const post = results[0].data.children[0].data
      post.url = post.url || ''
      post.domain = post.domain || ''
      const items = results[1].data.children
      const comments = {}, moreComments = {}, moreCommentIDs = {}
      let oldestComment = {}, newestComment = {}
      items.forEach(item => {
        const itemData = item.data
        if (item.kind === 't1') {
          comments[itemData.id] = itemData
          oldestComment = get_by_op_on_created_utc('<', itemData, oldestComment)
          //newestComment = get_by_op_on_created_utc('>', itemData, newestComment)
        } else if (item.kind === 'more') {
          // NOTE: This object is also used to make "continue this thread" links, per reddit.com/54qknz
          //       Those instances have itemData.count == 0
          moreComments[itemData.parent_id] = true
          item?.data?.children?.forEach(id => moreCommentIDs[id] = 1)
        }
      })
      return {
        post,
        comments, moreComments, moreCommentIDs, oldestComment,
        //newestComment, // not currently used
      }
    })
}

const operators = {
  '<': (a,b)=>a<b,
  '>': (a,b)=>a>b,
}

// compareComment < varComment, or compareComment > varComment
const get_by_op_on_created_utc = (op, compareComment, varComment) => {
  if (! varComment.created_utc || operators[op](compareComment.created_utc, varComment.created_utc)) {
    return compareComment
  }
  return varComment
}



export const OVERVIEW = 'overview', SUBMITTED = 'submitted', COMMENTS='comments', GILDED='gilded'
// when kind = 'posts', page redirects via src/index.js
const kinds = {
  'c': COMMENTS,
  's': SUBMITTED,
  'g': GILDED,
  'o': OVERVIEW,
  [COMMENTS]: COMMENTS,
  [SUBMITTED]: SUBMITTED,
  [GILDED]: GILDED,
  [OVERVIEW]: OVERVIEW,
  '': '',
  null: '',
  undefined: '',
}
export const kindsReverse = {
  [COMMENTS]: 'c',
  [SUBMITTED]: 's',
  [GILDED]: 'g',
  [OVERVIEW]: 'o',
  c: 'c',
  s: 's',
  g: 'g',
  o: 'o',
  '': '',
}

export const queryUserPageCombined = async (params) => {
  return queryUserPage({
    useProxy: false,
    include_info:true,
    include_parents:true,
    ...params,
  })
}

const notProxy_host = www_reddit_slash

const getHost = (useProxy = false) => {
  if (useProxy) {
    if (can_use_oauth_reddit_rev) {
      return OAUTH_REDDIT_REV
    } else {
      return notProxy_host
    }
  } else {
    if (can_use_oauth_reddit_rev) {
      return oauth_reddit
    } else {
      return notProxy_host
    }
  }
}

const addQuarantineParam = (host, params) => {
  if (host === OAUTH_REDDIT_REV) {
    params.quarantined = true
  }
}

export const EmptyUserPageResult = {items: [], after: null}

export const queryUserPage = async ({user, kind, sort, before, after, t, limit = 100,
  quarantined_subreddits,
  useProxy=false, include_info=false, include_parents=false}) => {
  const host = getHost(useProxy)
  const host_is_proxy = host === OAUTH_REDDIT_REV
  const params = {
    ...(sort && {sort}),
    ...(limit && {limit}),
    ...(t && {t}),
    ...(after && {after}),
    ...(before && {before}),
  }
  if (host_is_proxy) {
    params.include_info = include_info
    params.include_parents = include_parents
    if (quarantined_subreddits) {
      params.quarantined_subreddits = quarantined_subreddits
    }
  }
  let auth = await getAuth(host)
  if (host_is_proxy) {
    auth.method = 'POST'
    auth.body = auth.headers.Authorization
    delete auth.headers.Authorization
  }
  let json
  try {
    json = await fetchJsonAndValidate(host + `user/${user}/${kinds[kind]}.json` + '?'+paramString(params), auth)
  } catch (e) {
    if (host !== notProxy_host && e.message !== 'Forbidden') {
      can_use_oauth_reddit_rev = false
      return queryUserPageCombined({user, kind, ...params}) // host will be notProxy_host for this query
    }
    return e
  }
  if (host === OAUTH_REDDIT_REV) {
    if (! include_info && ! include_parents && json.user) {
      return json.user
    } else {
      return json
    }
  } else if (json.data?.children) {
    let items = []
    if (! include_info && ! include_parents) {
      items = json.data.children.map(item => item.data)
      return {
        items,
        after: json.data.after,
      }
    } else {
      const result = {
        user: {
          items,
          after: json.data.after,
        }
      }
      const commentIDs = []
      const parents_set = new Set()
      for (const item_listing of json.data.children) {
        const item = item_listing.data
        items.push(item)
        if (item.parent_id) {
          commentIDs.push(item.name)
          parents_set.add(item.parent_id)
          parents_set.add(item.link_id)
        }
      }
      const promises = []
      if (include_info) {
        promises.push(getItems({ids: commentIDs})
        .then(info => {
          result.info = info
        }))
      }
      if (include_parents) {
        promises.push(getItems({ids: Array.from(parents_set)})
        .then(parents => {
          result.parents = parents
        }))
      }
      try {
        await Promise.all(promises)
        return result
      } catch (e) {
        return e
      }
    }
  } else {
    let empty = {...EmptyUserPageResult}
    if ('message' in json && 'error' in json) {
      empty.message = json.message
      empty.error = json.error
    }
    return empty
  }
}

export const usernameAvailable = (user) => {
  var params = {user: user, raw_json:1}
  const url = oauth_reddit + 'api/username_available' + '?'+paramString(params)
  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(response => response.json())
  .catch(errorHandler)
}

const queryByID = async (ids, quarantined_subreddits, key = 'name', results = {}, host = oauth_reddit) => {
  const params = {id: ids.join(), raw_json:1}
  if (host === OAUTH_REDDIT_REV && quarantined_subreddits) {
    params.quarantined_subreddits = quarantined_subreddits
  }
  const auth = await getAuth(host)
  let path = 'api/info'
  if (host === www_reddit_slash) {
    path += '.json'
  }
  const queryForHost = (host) => query(host + path + '?'+paramString(params),
                                       auth, key, results)
  return redditLimiter.schedule(() => queryForHost(host))
  .catch(e => {
    if (host !== oauth_reddit && e.message !== 'Forbidden') {
      can_use_oauth_reddit_rev = false
      return queryForHost(oauth_reddit)
      .catch(errorHandler)
    }
    errorHandler(e)
  })
}

const getNumberFromHeader = (response, header) => Number(response?.headers?.get(header))
export const fetchRatelimitHeaders = async () => {
  const auth = await getAuth()
  const response = await fetch(oauth_reddit, auth)
  const reset = getNumberFromHeader(response, 'X-Ratelimit-Reset')
  const remaining = getNumberFromHeader(response, 'X-Ratelimit-Remaining')
  const used = getNumberFromHeader(response, 'X-Ratelimit-Used')
  if (reset) {
    return {reset, remaining, used}
  } else {
    return {reset: 600, used: 0, remaining: 100}
  }
}

const fetchJsonAndValidate = async (url, init = {}) => {
  if (getCustomClientID() || url.startsWith(www_reddit_slash)) {
    init.cache = 'reload'
  }
  const response = await window.fetch(url, init)
  let json
  try {
    json = await response.json()
  } catch (e) {
    console.error('fetchJsonAndValidate:', e)
  }
  return json || {}
}

const query = async (url, auth, key, results = {}) => {
  return fetchJsonAndValidate(url, auth)
  .then(json => json.data.children.reduce((map, obj) => mapRedditObj(map, obj, key), results))
}

// Results must include a post w/created_utc less than encompass_created_utc
// reference on async recursion w/promises: https://blog.scottlogic.com/2017/09/14/asynchronous-recursion.html#asynchronous-recursion-with-promises
export const querySubredditPageUntil = (subreddit, encompass_created_utc, after = '') => {
  return querySubredditPage({subreddit, sort: 'new', after})
  .then(data => {
    if (data.posts.slice(-1)[0].created_utc > encompass_created_utc && data.after) {
      return querySubredditPageUntil(subreddit, encompass_created_utc, data.after)
      .then(nextData => data.posts.concat(nextData))
    } else {
      return data.posts
    }
  })
}

export const querySubredditPage = async ({subreddit, sort, after = '', t = '', useProxy = false}) => {
  const host = getHost(useProxy)
  const params = {
    ...(after && {after}),
    ...(t && {t}),
    limit: 100,
    raw_json:1}
  addQuarantineParam(host, params)
  const url = host + `r/${subreddit}/${sort}.json` + '?'+paramString(params)
  const auth = await getAuth(host)
  return window.fetch(url, auth)
    .then(response => response.json())
    .then(results => {
      if (results.data) {
        return {
          posts: results.data.children.map(post => post.data),
          after: results.data.after,
          useProxy: host === OAUTH_REDDIT_REV,
        }
      } else if (results.reason === 'quarantined' && host !== OAUTH_REDDIT_REV) {
        return querySubredditPage({subreddit, sort, after, t, useProxy:true})
      }
    })
    .catch(errorHandler)
}

export const querySearch = ({selftexts = [], urls = []}) => {
  var params = {q:'', sort:'new', limit:100, t:'all'}
  if (selftexts.length) {
    params.q += encodeURIComponent(selftexts.map(x => `selftext:"${x}"`).join(' OR '))
  }
  if (urls.length) {
    params.q += encodeURIComponent(urls.map(x => `url:"${x}"`).join(' OR '))
  }
  const url = oauth_reddit + 'search/.json' + '?'+paramString(params)
  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(response => response.json())
  .then(json =>
    json.data.children.reduce((map, obj) => mapRedditObj(map, obj, 'id'), {})
  )
  .catch(() => {
    console.error('reddit.com/search failed')
    return {}
  })

}

const NUM_TOP_POSTS_TO_CONSIDER = 10
export const randomRedditor = async (subreddit = 'all') => {
  const mods_promise = subreddit === 'all' ? Promise.resolve({}) : getModerators(subreddit)
  return querySubredditPage({subreddit, sort: 'top', t: 'month'})
  .then(data => {
    const posts_with_most_comments = data.posts
      .sort((a,b) => b.num_comments - a.num_comments)
      .slice(0,NUM_TOP_POSTS_TO_CONSIDER)
    const post = posts_with_most_comments[getRandomInt(posts_with_most_comments.length)]
    return selectRandomCommenter(
      post,
      commentSortOptions[getRandomInt(commentSortOptions.length)],
      mods_promise,
      data.useProxy,
    )
  })
}

const NUM_AUTHORS_WHEN_COMMENT_KARMA_IS_LOW = 20
export const selectRandomCommenter = async (post, sort = 'new', mods_promise, useProxy = false) => {
  const host = getHost(useProxy)
  const params = {
    sort,
    limit: 200,
  }
  addQuarantineParam(host, params)
  const url = host + `r/${post.subreddit}/comments/${post.id}.json`+'?'+paramString(params)
  const auth = await getAuth(host)
  return window.fetch(url, auth)
  .then(response => response.json())
  .then(result => result[1].data.children)
  .then(traverseComments_collectAuthors)
  .then(authors => getAuthorInfo(Object.keys(authors)))
  .then(async (authorInfo) => {
    const mods = await Promise.resolve(mods_promise)
    const authorsWithoutMods = Object.values(authorInfo)
      .filter(x => ! mods[x.name])
    let authors_with_most_comment_karma = authorsWithoutMods
      .filter(x => x.comment_karma >= MIN_COMMENT_KARMA)
    if (authors_with_most_comment_karma.length < 5) {
      authors_with_most_comment_karma = authorsWithoutMods
        .sort((a,b) => b.comment_karma - a.comment_karma)
        .slice(0,NUM_AUTHORS_WHEN_COMMENT_KARMA_IS_LOW)
    }
    const author = authors_with_most_comment_karma[getRandomInt(authors_with_most_comment_karma.length)]
    return author.name
  })

}

const traverseComments_collectAuthors = (comments, authors = {}) => {
  comments.forEach(child => {
    const c = child.data
    if (c && c.author_fullname && ! c.distinguished) {
      authors[c.author_fullname] = c.author
    }
    if (c.replies && typeof c.replies === 'object' && c.replies.kind === 'Listing' && c.replies.data.children) {
      traverseComments_collectAuthors(c.replies.data.children, authors)
    }
  })
  return authors
}

export const getAuthorInfo = (ids, results = {}) => {
  const url = oauth_reddit + `api/user_data_by_account_ids.json?ids=${ids.join(',')}`

  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(result => result.json())
  .then(data => {
    Object.assign(results, data)
    return data
  })
}

export const getAuthorInfoByName = (ids) => {
  const results = {}
  return groupRequests(getAuthorInfo, ids, [results], 200)
  .then(() => {
    const authors = {}
    if (! ('error' in results) || ! ('message' in results)) {
      Object.values(results).forEach(obj => {
        obj.combined_karma = obj.link_karma + obj.comment_karma
        authors[obj.name] = obj
      })
    }
    return {
      authors,
      author_fullnames: results,
    }
  })
  .catch(errorHandler)
}

const getModlogsItems = async ({subreddit, itemType, limit = 100, link_id}) => {
  const hasModlogs = await subredditHasModlogs(subreddit, U_PUBLICMODLOGS_CODE)
  if (! hasModlogs) {
    return {}
  }
  const approved = (link_id && itemType == 'link') ? '&type=approvelink' : ''
  const remove = '&type=remove'+itemType
  const spam = '&type=spam'+itemType

  let auth = {}
  const urls = []
  const subreddit_lower = subreddit.toLowerCase()
  const params = `?feed=${u_publicmodlogs_feed}&user=publicmodlogs`
  const baseUrl = oauth_reddit + `r/${subreddit}/about/log/.json${params}`
  const spamParams = `${params}&only=links&limit=50`
  const spamUrl = oauth_reddit + `r/${subreddit}/about/spam/.json${spamParams}`
  auth = await getAuth()
  urls.push(...[
    spamUrl,
    baseUrl + remove + `&limit=${limit}`,
    baseUrl + spam + "&limit=50"
  ])
  if (approved) {
    urls.push(baseUrl + approved + "&limit=50")
  }
  const promises = urls.map(u => getJson(u, auth))
  return Promise.all(promises)
  .then(listings => postProcessModlogsListings(listings, link_id))
}

export const getModlogsPosts = ({subreddit, limit = 100, link_id}) => {
  return getModlogsItems({subreddit, itemType: 'link', limit, link_id})
}

export const getModlogsComments = ({subreddit, limit = 500, link_id}) => {
  return getModlogsItems({subreddit, itemType: 'comment', limit, link_id})
}

const postProcessModlogsListings = (listings, link_id = '') => {
  const items = {}
  for (const listing of listings) {
    if (listing && listing.data) {
      postProcessModlogsList(listing.data.children, link_id, items)
    }
  }
  return items
}

//input: list, link_id
//output: items
const postProcessModlogsList = (list, link_id = '', items = {}) => {
  for (const item of list) {
    let data = item // coronavirus log items have no 'data' item -> that service is down now, but keep this just in case
    if (item.data) {
      data = item.data
    }
    data.target_permalink = (data.target_permalink || data.permalink).replace(/^https?:\/\/[^/]*/,'')
    data.link_id = 't3_'+data.target_permalink.split('/')[4]
    if (link_id && data.link_id !== 't3_'+link_id) {
      continue
    }
    data.id = (data.target_fullname || data.name).slice(3)
    data.log_source = 'u_publicmodlogs'
    items[data.id] = data
  }
  return items
}

export const getSticky = async (subreddit, num) => {
  const url = oauth_reddit+`r/${subreddit}/hot.json?limit=2`
  const auth = await getAuth()
  return getJson(url, auth, '')
  .then(data => {
    let count = 1, prevStickyPermalink
    for (const child of data.data.children) {
      if (child.data.stickied) {
        if (count == num) {
          return child.data.permalink
        }
        prevStickyPermalink = child.data.permalink
        count += 1
      }
    }
    return prevStickyPermalink
  })
  .catch(error => '')
}

export const getJson = (url, options, valueOnError = {}) => {
  return window.fetch(url, options)
  .then(response => response.json())
  .catch(error => {
    return valueOnError
  })
}
