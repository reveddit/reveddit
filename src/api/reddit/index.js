import { chunk, flatten, fetchWithTimeout, promiseDelay, getRandomInt } from 'utils'
import { getAuth } from './auth'

const oauth_reddit = 'https://oauth.reddit.com/'
const numRequestsBeforeWait = 10
const waitInterval = numRequestsBeforeWait*500
const maxNumItems = 100
const commentSortOptions = ['confidence', 'new', 'controversial', 'old', 'qa']
const MIN_COMMENT_KARMA = 1000

const paramString = (params) => {
  return Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
}

const errorHandler = (e) => {
  throw new Error(`Could not connect to Reddit: ${e}`)
}

export const getComments = ({objects = undefined, ids = [], auth = null}) => {
  const full_ids = getFullIDsForObjects(objects, ids, 't1_')
  return getItems(full_ids, 'id', auth)
}

export const getPosts = ({objects = undefined, ids = [], auth = null}) => {
  const full_ids = getFullIDsForObjects(objects, ids, 't3_')
  return getItems(full_ids, 'id', auth)
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

export const getItems = async (ids, key = 'name', auth = null) => {
  const results = {}
  if (! auth) {
    auth = await getAuth()
  }
  return groupRequests(queryByID, ids, [auth, key, results], maxNumItems)
  .then(res => results)
  .catch(errorHandler)
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

export const getPostWithComments = (threadID, sort = 'old', limit=500) => {
  const params = {
    limit,
    sort,
    threaded: false,
    showmore: false
  }
  const url = oauth_reddit + `comments/${threadID}.json`+'?'+paramString(params)
  return getAuth()
    .then(auth => window.fetch(url, auth))
    .then(response => response.json())
    .then(results => {
      return {
        post: results[0].data.children[0].data,
        comments: results[1].data.children.reduce((map, obj) => mapRedditObj(map, obj, 'id'), {})
      }
    })
}

export const queryUserPage = (user, kind, sort, before, after, t, limit = 100) => {
  var params = {
    sort: sort,
    limit,
    ...(t && {t}),
    ...(after && {after}),
    ...(before && {before}),
    raw_json:1
  }

  const url = oauth_reddit + `user/${user}/${kind}.json` + '?'+paramString(params)
  return getAuth()
    .then(auth => window.fetch(url, auth))
    .then(response => response.json())
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
    .catch(errorHandler)
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
  const url = `https://api.revddit.com/q/old.reddit.com/user/${user}`
  return fetchWithTimeout(url, {}, 3000)
    .then(response => response.text())
    .then(html => {
      return {html: html}
    })
    .catch(error => {
      return {error: error.message}
    })
}

const queryByID = (ids, auth, key = 'name', results = {}) => {
  var params = {id: ids.join(), raw_json:1}
  const url = oauth_reddit + 'api/info' + '?'+paramString(params)
  return query(url, auth, key, results)
}

const query = async (url, auth, key, results = {}) => {
  return window.fetch(url, auth)
  .then(response => response.json())
  .then(json => json.data.children.reduce((map, obj) => mapRedditObj(map, obj, key), results))
  .catch(errorHandler)
}

// Results must include a post w/created_utc less than encompass_created_utc
// reference on async recursion w/promises: https://blog.scottlogic.com/2017/09/14/asynchronous-recursion.html#asynchronous-recursion-with-promises
export const querySubredditPageUntil = (sub, encompass_created_utc, after = '') => {
  return querySubredditPage(sub, 'new', after).then(
    data => {
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
  const url = oauth_reddit + 'search.json' + '?'+paramString(params)
  return getAuth()
    .then(auth => window.fetch(url, auth))
    .then(response => response.json())
    .then(json =>
      json.data.children.reduce((map, obj) => mapRedditObj(map, obj, 'id'), {})
    )
    .catch(errorHandler)
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
  .then(authors => getAuthorInfo(auth, Object.keys(authors)))
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

export const getAuthorInfo = async (auth, ids) => {
  const url = oauth_reddit + `api/user_data_by_account_ids.json?ids=${ids.join(',')}`
  if (! auth) {
    auth = await getAuth()
  }
  return window.fetch(url, auth)
  .then(result => result.json())
}
