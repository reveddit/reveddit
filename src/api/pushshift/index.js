import { toBase10, toBase36, chunk, flatten, getQueryString } from 'utils'

const postURL = 'https://elastic.pushshift.io/rs/submissions/_search?source_content_type=application/json&source='
const commentURL = 'https://elastic.pushshift.io/rc/comments/_search?source_content_type=application/json&source='
const comment_fields = [
  'id', 'author', 'body', 'created_utc', 'parent_id', 'score',
  'subreddit', 'link_id', 'author_flair_text', 'retrieved_on', 'retrieved_utc'
]

const postURL_new = 'https://api.pushshift.io/reddit/submission/search/'
const commentURL_new = 'https://api.pushshift.io/reddit/comment/search/'

// If before_id is set, response begins with that ID
export const getCommentsBySubreddit = async function(subreddits_str, n = 1000, before = '', before_id = '') {
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
  queryParams['size'] = 1000
  if (subreddits_str) {
    queryParams['subreddit'] = subreddits_str.replace(/\+/g,',')
  }
  queryParams['fields'] = 'id,created_utc'

  while (dataLength < n && numCalls < maxCalls) {
    if (before) {
      queryParams['before'] = before
    }

    let url = commentURL_new+getQueryString(queryParams)

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
  const ids = Object.keys(data).sort((a,b) => b.created_utc - a.created_utc).slice(0,n)
  return chunkAnd_getCommentsByID(ids)
}

// this expects short IDs in base36, without the t3_ prefix
export const chunkAnd_getCommentsByID = (ids) => {
  return Promise.all(chunk(ids, 1000)
    .map(ids => getCommentsByID(ids)))
    .then(flatten)
}

export const getCommentsByID = (ids) => {
  const params = 'ids='+ids.join(',')
  return window.fetch(commentURL_new+'?'+params)
    .then(response => response.json())
    .then(data => data.data)
}

export const getRecentPostsBySubreddit = (subreddits_str, n = 1000, before = '', before_id = '') => {
  const subreddits = subreddits_str.toLowerCase().split('+')
  const elasticQuery = {
    size:n,
    query: {
      bool: {
        filter: [{
          terms: {
            subreddit: subreddits
          }
        }]
      }
    },
    sort: {
      ['created_utc']: 'desc'
    },
    _source: ['retrieved_on','created_utc', 'is_robot_indexable', 'thumbnail']
  }
  if (before_id) {
    const id_base10 = toBase10(before_id)
    elasticQuery.query.bool.filter.push({'range' : { 'id': { 'lte': id_base10}}})
  } else if (before) {
    elasticQuery.query.bool.filter.push({'range': {'created_utc': {'lte': before}}})
  } else {
    elasticQuery.query.bool.filter.push({'range': {'created_utc': {'gte': 'now-30d/d'}}})
  }
  return window.fetch(postURL + JSON.stringify(elasticQuery))
    .then(response => response.json())
    .then(data => {
      return data.hits.hits.map( post => {
        const id = toBase36(post._id)
        post._source.id = id
        post._source.name = 't3_'+id
        return post._source
      })
    })
    .catch(() => { throw new Error('Unable to access Pushshift, cannot load recent posts') })
}

export const getRecentPostsByDomain = (domains_str, n = 1000, before = '', before_id = '') => {
  const domains = domains_str.toLowerCase().split('+')
  const elasticQuery = {
    size:n,
    query: {
      bool: {
        filter: [{
          terms: {
            domain: domains
          }
        }]
      }
    },
    sort: {
      ['created_utc']: 'desc'
    },
    _source: ['retrieved_on','created_utc', 'is_robot_indexable', 'thumbnail']
  }
  if (before_id) {
    const id_base10 = toBase10(before_id)
    elasticQuery.query.bool.filter.push({'range' : { 'id': { 'lte': id_base10}}})
  } else if (before) {
    elasticQuery.query.bool.filter.push({'range': {'created_utc': {'lte': before}}})
  } else {
    elasticQuery.query.bool.filter.push({'range': {'created_utc': {'gte': 'now-30d/d'}}})
  }
  return window.fetch(postURL + JSON.stringify(elasticQuery))
    .then(response => response.json())
    .then(data => {
      return data.hits.hits.map( post => {
        const id = toBase36(post._id)
        post._source.id = id
        post._source.name = 't3_'+id
        return post._source
      })
    })
    .catch(() => { throw new Error('Unable to access Pushshift, cannot load recent posts') })
}

// Function intended to be called with userpage-driven IDs
// note: if a post is old, pushshift will not have the is_robot_indexable field..
//       technically, this should be marked as removedby='unknown'
//       to simplify logic, in pages/user/index.js, marking this as removed by 'mod (or automod)'
export const getAutoremovedItems = names => {
  const queryParams = {}
  let isPostQuery = true
  let apiURL = postURL_new
  queryParams['fields'] = 'id,retrieved_on,created_utc,is_robot_indexable'
  if (names[0].slice(0,2) === 't1') {
    isPostQuery = false
    apiURL = commentURL_new
    queryParams['fields'] = 'id,retrieved_on,created_utc,author'
  }
  queryParams['ids'] = names.map(name => name.slice(3)).join(',')

  const url = apiURL+getQueryString(queryParams)
  return window.fetch(url)
    .then(response => response.json())
    .then(data => {
      const items = []
      data.data.forEach(item => {
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

// ES Pushshift maxClauseCount = 1024
export const getPosts = threadIDs => {
  return Promise.all(chunk(threadIDs, 1024)
    .map(ids => getPosts_chunk(ids)))
    .then(flatten)
}

export const getPosts_chunk = threadIDs => {
  const ids_base10 = threadIDs.map(id => toBase10(id.slice(3)))
  const elasticQuery = {
    query: {
      terms: {
        id: ids_base10
      }
    },
    size: threadIDs.length,
    _source: ['title','whitelist_status', 'url','num_comments']
  }

  return window.fetch(postURL + JSON.stringify(elasticQuery))
  .then(response => response.json())
  .then(response => {
    const posts = response.hits.hits
    return posts.map(post => {
      const id = toBase36(post._id)
      post._source.id = id
      post._source.name = 't3_'+id
      return post._source
    })
  })
}

export const getPost = threadID => {
  const elasticQuery = {
    query: {
      term: {
        id: toBase10(threadID)
      }
    }
  }

  return window.fetch(postURL + JSON.stringify(elasticQuery))
  .then(response => response.json())
  .then(response => {
    if (response.hits.hits.length) {
      const post = response.hits.hits[0]._source
      post.id = toBase36(post.id)
      return post
    } else {
      return {}
    }
  })
  .catch(() => { throw new Error('Could not get post') })
}

export const getCommentsByThread = (threadID) => {
  const params = `link_id=${threadID}&filter=${comment_fields.join(',')}&sort=asc&limit=30000`
  return window.fetch(commentURL_new+'?'+params)
    .then(response => response.json())
    .then(data => {
      return data.data.map(comment => {
        // Missing parent id === direct reply to thread
        if ((! ('parent_id' in comment)) || ! comment.parent_id) {
          comment.parent_id = 't3_'+threadID
        }
        return comment
      })
    })
}
