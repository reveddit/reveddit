import { toBase10, toBase36, chunk, flatten, getQueryString, promiseDelay } from 'utils'
import { fetchWithTimeout } from 'api/common'
const comment_fields = [
  'id', 'author', 'author_fullname', 'body', 'created_utc', 'parent_id', 'score',
  'subreddit', 'link_id', 'author_flair_text', 'retrieved_on', 'retrieved_utc',
  'distinguished', 'stickied' ]

const comment_fields_for_autoremoved = ['id', 'retrieved_on' ,'created_utc' ,'author', 'retrieved_utc']

const post_fields = ['id', 'retrieved_on', 'created_utc', 'is_robot_indexable', 'retrieved_utc', 'thumbnail', 'author_fullname']

const post_fields_for_comment_data = ['id', 'title', 'whitelist_status', 'url', 'author',
                                      'num_comments', 'quarantine', 'subreddit_subscribers']

const postURL = 'https://api.pushshift.io/reddit/submission/search/'
const commentURL = 'https://api.pushshift.io/reddit/comment/search/'
const elastic_commentURL = 'https://elastic.pushshift.io/rc/comments/_search?source='
const maxNumItems = 1000
const maxNumCommentsByID = 900
const waitInterval = 400

// PUSHSHIFT_MAX_COUNT_PER_QUERY is max count items returned by pushshift per query
// need to know this in order to use 'after' param while avoiding making extra pushshift calls
export const PUSHSHIFT_MAX_COUNT_PER_QUERY = 100

// retrieved_on will become retrieved_utc
// https://reddit.com/r/pushshift/comments/ap6vx5/changelog_changes_to_the_retrieved_on_key/
const update_retrieved_field = (item) => {
  if ('retrieved_utc' in item && item.retrieved_utc) {
    item.retrieved_on = item.retrieved_utc
  }
}

export const queryComments = (params, fields=comment_fields) => {
  return queryItems(params, commentURL, fields, 't1_', 'id')
}

export const queryPosts = (params) => {
  return queryItems(params, postURL, post_fields, 't3_', null)
}

const queryItems = ({q, author, subreddit, n = 500, sort='desc', before, after, domain,
                       url, selftext, parent_id, stickied, title, distinguished},
                     apiURL, fields, prefix, key = 'name') => {
  const results = {}
  if (after && ! before) {
    sort = 'asc'
  }
  const queryParams = {
    size: n,
    sort,
    fields: fields.join(','),
    ...(q && {q}),
    ...(author && {author}),
    ...(subreddit && {subreddit}),
    ...(after && {after: ifNumParseAndAdd(after, -1)}),
    ...(before && {before: ifNumParseAndAdd(before, 1)}),
    ...(domain && {domain}),
    ...(parent_id && {parent_id}),
    ...(stickied !== undefined && {stickied}),
    ...(title && {title}),
    ...(distinguished && {distinguished}),
  }
  if (selftext) queryParams.selftext = encodeURIComponent(selftext)
  if (url) queryParams.url = encodeURIComponent(url)

  return fetchUrlWithParams(apiURL, queryParams)
    .then(response => response.json())
    .then(data => {
      data.data.forEach(item => {
        update_retrieved_field(item)
        item.name = prefix+item.id
        results[item[key]] = item
      })
      if (key) {
        return results
      } else {
        return data.data
      }
    })
}

const fetchUrlWithParams = (url, queryParams, fetchFn = window.fetch, options = {}) => {
  if (! queryParams.q) {
    queryParams.q = '*'
  }
  return fetchFn(url+getQueryString(queryParams), options)
}

// this expects short IDs in base36, without the t1_ prefix
// fields must include 'id'
export const getCommentsByID = async (ids, field='ids', fields=comment_fields) => {
  const results = {}
  let i = 0
  for (const ids_chunk of chunk(ids, maxNumCommentsByID)) {
    if (i > 0) {
      await promiseDelay(waitInterval)
    }
    await getCommentsByID_chunk(ids_chunk, field, fields, results)
    i += 1
  }
  return results
}

export const getCommentsByID_chunk = (ids, field='ids', fields=comment_fields, results={}) => {
  const queryParams = {
    fields: fields.join(','),
    size: ids.length,
    [field]: ids.join(',')
  }
  return fetchUrlWithParams(commentURL, queryParams)
    .then(response => response.json())
    .then(data => {
      data.data.forEach(item => {
        update_retrieved_field(item)
        results[item.id] = item
      })
      return results
    })
}

export const getPostsByIDForCommentData = (ids) => {
  const fields = post_fields_for_comment_data
  return getPostsByID(ids.map(id => id.slice(3)), fields)
  .then(posts => {
    return posts.reduce((map, obj) => (map[obj.name] = obj, map), {})
  })
}

const postProcessPost = (item) => {
  item.name = 't3_'+item.id
  update_retrieved_field(item)
}

const sortCreatedDesc = (a,b) => b.created_utc - a.created_utc

export const getPostsBySubredditOrDomain = function(args) {
  return getItemsBySubredditOrDomain({
    ...args,
    ps_url: postURL,
    fields: post_fields,
  })
  .then(items => {
    items.forEach(postProcessPost)
    return items.sort(sortCreatedDesc)
  })
}

export const getCommentsBySubreddit = function(args) {
  return getItemsBySubredditOrDomain({
    ...args,
    ps_url: commentURL,
    fields: comment_fields,
  })
  .then(items => items.sort(sortCreatedDesc))
  // disabled below b/c pushshift disabled postgres, and the next result is now empty
  // .then(items => {
  //   return getCommentsByID(items.map(item => item.id))
  //   .then(commentsObj => {
  //     return Object.values(commentsObj).sort(sortCreatedDesc)
  //   })
  // })
}

const ifNumParseAndAdd = (n, add) => {
  if (/^\d+$/.test(n)) {
    return parseInt(n)+add
  } else {
    return n
  }

}

export const getItemsBySubredditOrDomain = function(
  {subreddit:subreddits_str, domain:domains_str, n=maxNumItems, before='', after='',
   ps_url, fields}
) {
  const queryParams = {
    sort: 'desc',
    size: n,
    fields,
  }
  if (before) {
    queryParams['before'] = ifNumParseAndAdd(before, 1)
  } else if (after) {
    queryParams['after'] = ifNumParseAndAdd(after, -1)
    queryParams['sort'] = 'asc'
  }
  if (subreddits_str) {
    queryParams['subreddit'] = subreddits_str.toLowerCase().replace(/\+/g,',')
  } else if (domains_str) {
    queryParams['domain'] = domains_str.toLowerCase().replace(/\+/g,',')
  }
  return fetchUrlWithParams(ps_url, queryParams)
  .then(response => response.json())
  .then(data => data.data)
}


export const getPostsByID = (ids, fields = post_fields) => {
  return Promise.all(chunk(ids, maxNumItems)
    .map(ids => getPostsByID_chunk(ids, fields)))
    .then(flatten)
}

export const getPostsByID_chunk = (ids, fields = post_fields) => {
  const params = {
    ids: ids.join(','),
    fields: fields.join(','),
  }
  return fetchUrlWithParams(postURL, params)
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
  const params = {ids: id}
  return fetchUrlWithParams(postURL, params, fetchWithTimeout)
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

  return fetchUrlWithParams(apiURL, queryParams)
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

// this is not currently working on reveddit due to missing access-control-allow-origin header
// export const getCommentsByThread = (threadID) => {
//   const elasticQuery = {
//     query: {
//       match: {
//         link_id: toBase10(threadID)
//       }
//     },
//     size: 20000,
//     _source: comment_fields
//   }
//   return window.fetch(elastic_commentURL + JSON.stringify(elasticQuery))
//   .then(response => response.json())
//   .then(result => {
//     return result.hits.hits.reduce((map, comment_meta) => {
//       const comment = comment_meta._source
//       comment.id = toBase36(comment_meta._id)
//       comment.link_id = 't3_'+toBase36(comment.link_id)
//       update_retrieved_field(comment)
//       // Missing parent id === direct reply to thread
//       if (! comment.parent_id) {
//         comment.parent_id = 't3_'+threadID
//       } else {
//         comment.parent_id = toBase36(comment.parent_id)
//       }
//       map[comment.id] = comment
//       return map
//     }, {})
//   })
//   .catch(() => { throw new Error('Could not get removed comments') })
// }


// api.pushshift.io currently only returns results with q=* specified and that limits result size to 100
export const getCommentsByThread = (link_id, after='') => {
  const queryParams = {
    link_id,
    limit: 30000,
    sort: 'asc',
    fields: comment_fields.join(','),
    ...(after && {after})
  }
  return fetchUrlWithParams(commentURL, queryParams)
    .then(response => response.json())
    .then(data => {
      return data.data.reduce((map, comment) => {
        update_retrieved_field(comment)
        // Missing parent id === direct reply to thread
        if ((! ('parent_id' in comment)) || ! comment.parent_id) {
          comment.parent_id = 't3_'+threadID
        }
        map[comment.id] = comment
        return map
      }, {})
    })
}
