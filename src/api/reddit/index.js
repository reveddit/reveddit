import { chunk, flatten, fetchWithTimeout, promiseDelay, getRandomInt, paramString } from 'utils'
import { getAuth } from './auth'

const https = 'https://'
export const oauth_reddit = https+'oauth.reddit.com/'
export const oauth_reddit_rev = https+'ored.reveddit.com/'
let can_use_oauth_reddit_rev = true
export const www_reddit = https+'www.reddit.com'
export const old_reddit = https+'old.reddit.com'

const reveddit_cors = REVEDDIT_CORS_ANWHERE_HOST
const u_publicmodlogs_feed = '7e9b27126097f51ae6c9cd5b049af34891da6ba6'
const coronavirus_logs = https+'logs.mod.rcoronavirus.org/.json'
const coronavirus_subs = ['coronavirus','covid19']
const numRequestsBeforeWait = 100
const waitInterval = 5000
const maxNumItems = 100
const commentSortOptions = ['confidence', 'new', 'controversial', 'old', 'qa']
const MIN_COMMENT_KARMA = 1000


const errorHandler = (e) => {
  throw new Error(`Could not connect to Reddit: ${e}`)
}

export const getComments = ({objects = undefined, ids = [], auth = null, useProxy = false}) => {
  const full_ids = getFullIDsForObjects(objects, ids, 't1_')
  return getItems(full_ids, 'id', auth, oauth_reddit, useProxy)
}

export const getPosts = ({objects = undefined, ids = [], auth = null, useProxy = false}) => {
  const full_ids = getFullIDsForObjects(objects, ids, 't3_')
  return getItems(full_ids, 'id', auth, oauth_reddit, useProxy)
}

export const getModerators = (subreddit, useProxy = false) => {
  let host = oauth_reddit
  if (useProxy) {
    host = oauth_reddit_rev
  }
  const url = host + `r/${subreddit}/about/moderators/.json`
  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(response => response.json())
  .catch(error => {return {}})
  .then(getModeratorsPostProcess)
}

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

export const getModeratedSubreddits = (user) => {
  const url = oauth_reddit + `user/${user}/moderated_subreddits/.json`
  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(response => response.json())
  .then(results => {
    return (results.data || []).reduce((map, obj) => (map[obj.sr.toLowerCase()] = true, map), {['u_'+user]: true})
  })
}

export const getSubredditAbout = (subreddit, useProxy = false) => {
  let host = oauth_reddit
  if (useProxy) {
    host = oauth_reddit_rev
  }
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

export const getPostsByURL = (urlParam, auth = null, results) => {
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

export const mapRedditObj = (map, obj, key = 'name') => (map[obj.data[key]] = obj.data, map)

export const getItems = async (ids, key = 'name', auth = null, host = oauth_reddit, useProxy = false) => {
  const results = {}
  if (! ids.length) {
    return results
  }
  if (! auth) {
    auth = await getAuth()
  }
  if (useProxy) {
    host = oauth_reddit_rev
  }
  return groupRequests(queryByID, ids, [auth, key, results, host], maxNumItems)
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

export const getPostWithComments = ({threadID, commentID: comment, context = 0, sort = 'old', limit=500, useProxy = false}) => {
  const params = {
    limit,
    sort,
    threaded: false,
    showmore: true,
    ...(comment && {comment}),
    ...(context && {context})
  }
  let host = oauth_reddit
  if (useProxy) {
    host = oauth_reddit_rev
  }
  const url = host + `comments/${threadID}.json`+'?'+paramString(params)
  return getAuth()
    .then(auth => window.fetch(url, auth))
    .then(response => response.json())
    .then(results => {
      if (results.message === 'Forbidden') {
        throw results
      }
      const items = results[1].data.children
      const comments = {}, moreComments = {}
      let oldestComment = {}
      items.forEach(item => {
        const itemData = item.data
        if (item.kind === 't1') {
          comments[itemData.id] = itemData
          if (! oldestComment.created_utc || itemData.created_utc < oldestComment.created_utc) {
            oldestComment = itemData
          }
        } else if (item.kind === 'more') {
          // NOTE: This object is also used to make "continue this thread" links, per reddit.com/54qknz
          //       Those instances have itemData.count == 0
          moreComments[itemData.parent_id] = true
        }
      })
      return {
        post: results[0].data.children[0].data,
        comments, moreComments, oldestComment
      }
    })
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

export const queryUserPage = async (user, kind, sort, before, after, t, limit = 100, host = oauth_reddit) => {
  var params = {
    ...(sort && {sort}),
    ...(limit && {limit}),
    ...(t && {t}),
    ...(after && {after}),
    ...(before && {before}),
  }
  const auth = await getAuth()
  if (! can_use_oauth_reddit_rev) {
    host = oauth_reddit
  }
  const fetchForHost = (host) =>
    window.fetch(host + `user/${user}/${kinds[kind]}.json` + '?'+paramString(params), auth)
    .then(response => response.json())
  return fetchForHost(host)
  .catch(e => {
    if (host !== oauth_reddit) {
      can_use_oauth_reddit_rev = false
      return fetchForHost(oauth_reddit)
      .catch(errorHandler)
    }
    errorHandler(e)
  })
  .then(results => {
    if (!('data' in results)) {
      let empty = {items: [], after: null}
      if ('message' in results && 'error' in results) {
        empty.message = results.message
        empty.error = results.error
      }
      return empty
    } else {
      return {
        items: results.data.children.map(item => item.data),
        after: results.data.after
      }
    }
  })
}

export const usernameAvailable = (user) => {
  var params = {user: user, raw_json:1}
  const url = oauth_reddit + 'api/username_available' + '?'+paramString(params)
  return getAuth()
  .then(auth => window.fetch(url, auth))
  .then(response => response.json())
  .catch(errorHandler)
}

export const userPageHTML = (user) => {
  const url = reveddit_cors+`old.reddit.com/user/${user}`
  return fetchWithTimeout(url, {'Accept-Language': 'en'}, 3000)
  .then(response => response.text())
  .then(html => {
    return {html: html}
  })
  .catch(error => {
    return {error: error.message}
  })
}

const queryByID = (ids, auth, key = 'name', results = {}, host = oauth_reddit) => {
  var params = {id: ids.join(), raw_json:1}
  if (! can_use_oauth_reddit_rev) {
    host = oauth_reddit
  }
  const queryForHost = (host) => query(host + 'api/info' + '?'+paramString(params),
                                       auth, key, results)
  return queryForHost(host)
  .catch(e => {
    if (host !== oauth_reddit) {
      can_use_oauth_reddit_rev = false
      return queryForHost(oauth_reddit)
      .catch(errorHandler)
    }
    errorHandler(e)
  })
}

const query = async (url, auth, key, results = {}) => {
  return window.fetch(url, auth)
  .then(response => response.json())
  .then(json => json.data.children.reduce((map, obj) => mapRedditObj(map, obj, key), results))
}

// Results must include a post w/created_utc less than encompass_created_utc
// reference on async recursion w/promises: https://blog.scottlogic.com/2017/09/14/asynchronous-recursion.html#asynchronous-recursion-with-promises
export const querySubredditPageUntil = (sub, encompass_created_utc, after = '') => {
  return querySubredditPage(sub, 'new', after)
  .then(data => {
    if (data.posts.slice(-1)[0].created_utc > encompass_created_utc && data.after) {
      return querySubredditPageUntil(sub, encompass_created_utc, data.after)
      .then(nextData => data.posts.concat(nextData))
    } else {
      return data.posts
    }
  })
}

export const querySubredditPage = async (subreddit, sort, after = '', t = '', auth = null) => {
  var params = {
    ...(after && {after}),
    ...(t && {t}),
    limit: 100,
    raw_json:1}
  const url = oauth_reddit + `r/${subreddit}/${sort}.json` + '?'+paramString(params)
  if (! auth) {
    auth = await getAuth()
  }
  return window.fetch(url, auth)
    .then(response => response.json())
    .then(results => {
      return {posts: results.data.children.map(post => post.data),
              after: results.data.after} })
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

export const randomRedditor = async () => {
  const auth = await getAuth()
  return get_rAll_posts(auth)
    .then(data => data.posts[getRandomInt(data.posts.length)])
    .then(post => selectRandomCommenter(auth, post, commentSortOptions[getRandomInt(commentSortOptions.length)]))
}

export const get_rAll_posts = async (auth = null) => {
  return querySubredditPage('all', 'top', '', 'day', auth)
}

export const selectRandomCommenter = async (auth, post, sort = 'new') => {
  const url = oauth_reddit + `r/${post.subreddit}/comments/${post.id}.json?sort=${sort}&limit=200`
  if (! auth) {
    auth = await getAuth()
  }
  return window.fetch(url, auth)
  .then(response => response.json())
  .then(result => result[1].data.children)
  .then(traverseComments_collectAuthors)
  .then(authors => getAuthorInfo(Object.keys(authors)))
  .then(authorInfo => {
    const author_keys = Object.keys(authorInfo).sort(() => Math.random() - 0.5);
    let maxKarma = 0
    let maxKarmaAuthor = ''
    for (let i = 0; i < author_keys.length; i++) {
      const author = authorInfo[author_keys[i]]
      if (author.comment_karma >= MIN_COMMENT_KARMA) {
        return author.name
      } else if (author.comment_karma > maxKarma) {
        maxKarma = author.comment_karma
        maxKarmaAuthor = author.name
      }
    }
    return maxKarmaAuthor
  })

}

const traverseComments_collectAuthors = (comments, authors = {}) => {
  comments.forEach(child => {
    const c = child.data
    if (c && c.author_fullname) {
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
  return groupRequests(getAuthorInfo, ids, [results], 500)
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
  const remove = '&type=remove'+itemType
  const spam = '&type=spam'+itemType
  let auth = {}
  const urls = []
  const subreddit_lower = subreddit.toLowerCase()
  if (coronavirus_subs.includes(subreddit_lower)) {
    urls.push(coronavirus_logs + "?limit=200" + `&subreddit=${subreddit}` + remove)
  } else {
    const baseUrl = oauth_reddit + `r/${subreddit}/about/log/.json?feed=${u_publicmodlogs_feed}&user=publicmodlogs`
    auth = await getAuth()
    urls.push(...[
      baseUrl + remove + `&limit=${limit}`,
      baseUrl + spam + "&limit=50"
    ])
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
    let data = item // coronavirus log items have no 'data' item
    if (item.data) {
      data = item.data
    }
    data.target_permalink = data.target_permalink.replace(/^https?:\/\/[^/]*/,'')
    data.link_id = 't3_'+data.target_permalink.split('/')[4]
    if (link_id && data.link_id !== 't3_'+link_id) {
      continue
    }
    data.id = data.target_fullname.slice(3)
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
