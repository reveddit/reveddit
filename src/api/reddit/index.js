import { chunk, flatten, fetchWithTimeout, promiseDelay } from 'utils'
import { getAuth } from './auth'

const oauth_reddit = 'https://oauth.reddit.com/'
const numRequestsBeforeWait = 10
const waitInterval = numRequestsBeforeWait*500
const maxNumItems = 100

const errorHandler = (e) => {
  throw new Error(`Could not connect to Reddit: ${e}`)
}

export const getComments = commentIDs => {
  const full_ids = commentIDs.map(id => `t1_${id}`)
  return getItems(full_ids)
}

export const getItems = async (ids) => {
  return getAuth()
  .then(async (auth) => {
    const results = []
    let i = 0
    for (const ids_chunk of chunk(ids, maxNumItems)) {
      if (i > 0 && i % numRequestsBeforeWait === 0) {
        await promiseDelay(waitInterval)
      }
      const result = queryByID(ids_chunk, auth)
      results.push(result)
      i += 1
    }
    return Promise.all(results).then(flatten)
  })
  .catch(errorHandler)
}

export const queryUserPage = (user, kind, sort, before, after, limit = 100) => {
  var params = {sort: sort, limit: limit, raw_json:1}
  if (after) {
    params.after = after
  }
  if (before) {
    params.before = before
  }
  const url = oauth_reddit + `user/${user}/${kind}.json` + '?'+Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
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
  const url = oauth_reddit + 'api/username_available' + '?'+Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
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

const queryByID = (ids, auth) => {
  var params = {id: ids.join(), raw_json:1}
  const url = oauth_reddit + 'api/info' + '?'+Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
  return window.fetch(url, auth)
  .then(response => response.json())
  .then(results => results.data.children)
  .then(data => data.map(thing => thing.data))
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

export const querySubredditPage = (subreddit, sort, after = '') => {
  var params = {after: after, limit: 100, raw_json:1}
  const url = oauth_reddit + `r/${subreddit}/${sort}.json` + '?'+Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
  return getAuth()
    .then(auth => window.fetch(url, auth))
    .then(response => response.json())
    .then(results => {
      return {posts: results.data.children.map(post => post.data),
              after: results.data.after} })
    .catch(errorHandler)
}


export const querySearchPageByUser = (user, sort, after = '') => {
  var params = {q:`author:${user}`, sort:sort, after:after, limit:100, t:'all', include_over_18:'on'}
  const url = oauth_reddit + 'search.json' + '?'+Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
  return getAuth()
    .then(auth => window.fetch(url, auth))
    .then(response => response.json())
    .then(results => {
      return {posts: results.data.children.map(post => post.data),
              after: results.data.after} })
    .catch(errorHandler)
}
