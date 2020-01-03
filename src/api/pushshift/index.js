import { toBase10, toBase36, chunk, flatten, getQueryString, promiseDelay } from 'utils'

const comment_fields = [
  'id', 'author', 'body', 'created_utc', 'parent_id', 'score',
  'subreddit', 'link_id', 'author_flair_text', 'retrieved_on', 'retrieved_utc' ]

const comment_fields_for_autoremoved = ['id', 'retrieved_on' ,'created_utc' ,'author', 'retrieved_utc']

const post_fields = ['id', 'retrieved_on', 'created_utc', 'is_robot_indexable', 'retrieved_utc']

const post_fields_for_comment_data = ['id', 'title', 'whitelist_status', 'url', 'num_comments', 'quarantine']

const postURL = 'https://api.pushshift.io/reddit/submission/search/'
const commentURL = 'https://api.pushshift.io/reddit/comment/search/'

const maxNumItems = 1000
const waitInterval = 400

// retrieved_on will become retrieved_utc
// https://www.reddit.com/r/pushshift/comments/ap6vx5/changelog_changes_to_the_retrieved_on_key/
const update_retrieved_field = (item) => {
  if ('retrieved_utc' in item && item.retrieved_utc) {
    item.retrieved_on = item.retrieved_utc
  }
}

export const queryComments = (params) => {
  return queryItems(params, commentURL, comment_fields, 't1_')
}

export const queryPosts = (params) => {
  return queryItems(params, postURL, post_fields, 't3_')
}

const queryItems = ({q, author, subreddit, n = 500, sort='desc', before, after, domain, url, selftext}, apiURL, fields, prefix) => {
  const queryParams = {size: n, sort, fields: fields.join(',')}
  if (q) queryParams.q = q
  if (author) queryParams.author = author
  if (subreddit) queryParams.subreddit = subreddit
  if (after) queryParams.after = after
  if (before) queryParams.before = before
  if (domain) queryParams.domain = domain
  if (selftext) queryParams.selftext = selftext
  if (url) queryParams.url = encodeURIComponent(url)

  return window.fetch(apiURL+getQueryString(queryParams))
    .then(response => response.json())
    .then(data => {
      data.data.forEach(item => {
        update_retrieved_field(item)
        item.name = prefix+item.id
      })
      return data.data
    })
}

// If before_id is set, response begins with that ID
export const getCommentsBySubreddit = async function({subreddit: subreddits_str, n=maxNumItems, before='', before_id=''}) {
  const data = {}
  let queryParams = {}
  let dataLength = 0
  let foundStartingPoint = true
  let maxCalls = 5, numCalls = 0
  if (before_id) {
    foundStartingPoint = false
    before = parseInt(before)+1
  }
  queryParams['sort'] = 'desc'
  queryParams['size'] = maxNumItems
  if (subreddits_str) {
    queryParams['subreddit'] = subreddits_str.toLowerCase().replace(/\+/g,',')
  }
  queryParams['fields'] = 'id,created_utc'
  if (n > maxNumItems) {
    maxCalls = Math.ceil(n/maxNumItems)+2
  }

  while (dataLength < n && numCalls < maxCalls) {
    if (before) {
      queryParams['before'] = before
    }

    let url = commentURL+getQueryString(queryParams)
    if (numCalls > 0) {
      await promiseDelay(waitInterval)
    }
    const items = await window.fetch(url)
      .then(response => response.json())
      .then(data => data.data)
    before = items[items.length-1].created_utc+1
    items.forEach(item => {
      if (before_id && item.id === before_id) {
        foundStartingPoint = true
      }
      if (foundStartingPoint) {
        data[item.id] = item
      }
    })
    if (before_id && ! foundStartingPoint) {
      console.error('data displayed is an approximation, starting id not found in first set of results: '+before_id)
      items.forEach(item => {
        data[item.id] = item
      })
      break
    }
    dataLength = Object.keys(data).length

    numCalls += 1
  }
  const ids = Object.keys(data).sort((a,b) => data[b].created_utc - data[a].created_utc).slice(0,n)
  return getCommentsByID(ids)
}

// this expects short IDs in base36, without the t1_ prefix
export const getCommentsByID = async (ids) => {
  const results = []
  let i = 0
  for (const ids_chunk of chunk(ids, maxNumItems)) {
    if (i > 0) {
      await promiseDelay(waitInterval)
    }
    const result = await getCommentsByID_chunk(ids_chunk)
    results.push(result)
    i += 1
  }
  return flatten(results)
}

export const getCommentsByID_chunk = (ids) => {
  const params = 'ids='+ids.join(',')+`&fields=${comment_fields.join(',')}`
  return window.fetch(commentURL+'?'+params)
    .then(response => response.json())
    .then(data => {
      data.data.forEach(item => {
        update_retrieved_field(item)
      })
      return data.data
    })
}

export const getPostsByIDForCommentData = (ids) => {
  const fields = post_fields_for_comment_data
  return getPostsByID(ids, fields)
}

// If before_id is set, response begins with that ID
export const getPostsBySubredditOrDomain = async function({subreddit:subreddits_str, domain:domains_str, n=maxNumItems, before='', before_id=''}) {
  const data = {}
  let queryParams = {}
  let dataLength = 0
  let foundStartingPoint = true
  let maxCalls = 5, numCalls = 0
  if (before_id) {
    foundStartingPoint = false
    before = parseInt(before)+1
  }
  queryParams['sort'] = 'desc'
  queryParams['size'] = maxNumItems
  if (subreddits_str) {
    queryParams['subreddit'] = subreddits_str.toLowerCase().replace(/\+/g,',')
  } else if (domains_str) {
    queryParams['domain'] = domains_str.toLowerCase().replace(/\+/g,',')
  }
  queryParams['fields'] = post_fields

  if (n > maxNumItems) {
    maxCalls = Math.ceil(n/maxNumItems)+2
  }
  while (dataLength < n && numCalls < maxCalls) {
    if (before) {
      queryParams['before'] = before
    }

    let url = postURL+getQueryString(queryParams)
    if (numCalls > 0) {
      await promiseDelay(waitInterval)
    }
    const items = await window.fetch(url)
      .then(response => response.json())
      .then(data => data.data)
    before = items[items.length-1].created_utc+1
    items.forEach(item => {
      if (before_id && item.id === before_id) {
        foundStartingPoint = true
      }
      if (foundStartingPoint) {
        item.name = 't3_'+item.id
        update_retrieved_field(item)
        data[item.id] = item
      }
    })
    if (before_id && ! foundStartingPoint) {
      console.error('data displayed is an approximation, starting id not found in first set of results: '+before_id)
      items.forEach(item => {
        item.name = 't3_'+item.id
        update_retrieved_field(item)
        data[item.id] = item
      })
      break
    }
    dataLength = Object.keys(data).length

    numCalls += 1
  }
  return Object.values(data).sort((a,b) => b.created_utc - a.created_utc).slice(0,n)
}

export const getPostsByID = (ids, fields = post_fields) => {
  return Promise.all(chunk(ids, maxNumItems)
    .map(ids => getPostsByID_chunk(ids, fields)))
    .then(flatten)
}

export const getPostsByID_chunk = (ids, fields = post_fields) => {
  const params = 'ids='+ids.join(',')+'&fields='+fields.join(',')
  return window.fetch(postURL+'?'+params)
    .then(response => response.json())
    .then(data => {
      data.data.forEach(post => {
        update_retrieved_field(post)
        post.name = 't3_'+post.id
      })
      return data.data
    })
}

export const getPost = id => {
  const params = 'ids='+id
  return window.fetch(postURL+'?'+params)
    .then(response => response.json())
    .then(data => {
      if (data.data.length) {
        update_retrieved_field(data.data[0])
        return data.data[0]
      } else {
        return {}
      }
    })
}

// Function intended to be called with userpage-driven IDs
// note: if a post is old, pushshift will not have the is_robot_indexable field..
//       technically, this should be marked as removedby='unknown'
//       to simplify logic, in pages/user/index.js, marking this as removed by 'mod (or automod)'
export const getAutoremovedItems = names => {
  const queryParams = {}
  let isPostQuery = true
  let apiURL = postURL
  queryParams['fields'] = post_fields.join(',')
  if (names[0].slice(0,2) === 't1') {
    isPostQuery = false
    apiURL = commentURL
    queryParams['fields'] = comment_fields_for_autoremoved.join(',')
  }
  queryParams['ids'] = names.map(name => name.slice(3)).join(',')

  const url = apiURL+getQueryString(queryParams)
  return window.fetch(url)
    .then(response => response.json())
    .then(data => {
      const items = []
      data.data.forEach(item => {
        update_retrieved_field(item)
        if (isPostQuery) {
          if ('is_robot_indexable' in item &&
              ! item.is_robot_indexable) {
            items.push(item)
          }
        } else if (item.author.replace(/\\/g,'') === '[deleted]') {
          items.push(item)
        }
      })
      return items
    })
    .catch(() => { throw new Error('Unable to access Pushshift, cannot load removed-by labels') })
}


export const getCommentsByThread = (threadID) => {
  const params = `link_id=${threadID}&fields=${comment_fields.join(',')}&sort=asc&limit=30000`
  return window.fetch(commentURL+'?'+params)
    .then(response => response.json())
    .then(data => {
      return data.data.map(comment => {
        update_retrieved_field(comment)
        // Missing parent id === direct reply to thread
        if ((! ('parent_id' in comment)) || ! comment.parent_id) {
          comment.parent_id = 't3_'+threadID
        }
        return comment
      })
    })
}
