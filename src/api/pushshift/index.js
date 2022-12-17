import { toBase10, toBase36, chunk, flatten, getQueryString, promiseDelay } from 'utils'
import { fetchWithTimeout } from 'api/common'

export const comment_fields_for_user_page_lookup = ['id', 'retrieved_on' ,'created_utc' ,'author', 'retrieved_utc', 'author_flair_text']
export const post_fields_for_user_page_lookup = [
  'id', 'retrieved_on' ,'created_utc' , 'is_robot_indexable', 'is_crosspostable', 'retrieved_utc', 'author_flair_text']

const post_fields = [...post_fields_for_user_page_lookup, 'thumbnail', 'author_fullname', 'url', 'domain', 'title']
const post_fields_for_manually_approved_lookup = ['id','retrieved_on','retrieved_utc','is_robot_indexable']
const comment_fields = [
  ...comment_fields_for_user_page_lookup,
  'author_fullname', 'body', 'parent_id', 'score',
  'subreddit', 'link_id',
  'distinguished', 'stickied' ]

const post_fields_for_comment_data = ['id', 'title', 'whitelist_status', 'url', 'author',
                                      'num_comments', 'quarantine', 'subreddit_subscribers']

const postURL = 'https://api.pushshift.io/reddit/submission/search'
const commentURL = 'https://api.pushshift.io/reddit/comment/search'
const elastic_commentURL = 'https://elastic.pushshift.io/rc/comments/_search?source='
const maxNumItems = 1000
const maxNumCommentsByID = 500
const maxNumPostsByID = 500
const waitInterval = 400
const PUSHSHIFT_API_MAX_QUERY_SIZE = 1000
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

const queryItems = ({q, author, subreddit, n = 500, sort='desc', sort_type, before, after, domain,
                     url, selftext, parent_id, stickied, title, distinguished,
                     user_flair: author_flair_text,
                     },
                     apiURL, fields, prefix, key = 'name') => {
  const results = {}
  if (after && ! before && ! sort_type) {
    sort = 'asc'
  }
  const queryParams = {
    size: n,
    sort,
    fields: fields.join(','),
    ...(q && {q}),
    ...(author && {author}),
    ...(author_flair_text && {author_flair_text}),
    ...(subreddit && {subreddit}),
    ...(after && {after: ifNumParseAndAdd(after, -1)}),
    ...(before && {before: ifNumParseAndAdd(before, 1)}),
    ...(domain && {domain}),
    ...(parent_id && {parent_id}),
    ...(stickied !== undefined && {stickied}),
    ...(title && {title}),
    ...(distinguished && {distinguished}),
    ...(sort_type && {sort_type}),
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
export const getCommentsByID = async ({ids, field='ids', fields=comment_fields}) => {
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

const getCommentsByID_chunk = (ids, field='ids', fields=comment_fields, results={}) => {
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
        item.name = 't1_'+item.id // don't need to retrieve name from archive, but itemIsRemovedOrDeleted() expects it
        results[item.id] = item
      })
      return results
    })
}

export const getPostsByIDForCommentData = (ids) => {
  return getPostsByID({ids: ids.map(id => id.slice(3)), fields: post_fields_for_comment_data})
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
  .then(items => {
    items.forEach(update_retrieved_field)
    return items.sort(sortCreatedDesc)
  })
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


export const getPostsByID = ({ids, fields = post_fields}) => {
  return Promise.all(chunk(ids, maxNumPostsByID)
    .map(ids => getPostsByID_chunk(ids, fields)))
    .then(dictionaries => {
      const results = {}
      for (const dict of dictionaries) {
        Object.assign(results, dict)
      }
      return results
    })
}

const getPostsByID_chunk = (ids, fields = post_fields) => {
  const params = {
    ids: ids.join(','),
    fields: fields.join(','),
  }
  return fetchUrlWithParams(postURL, params)
    .then(response => response.json())
    .then(data => {
      const result = {}
      data.data.forEach(post => {
        update_retrieved_field(post)
        post.name = 't3_'+post.id
        result[post.id] = post
      })
      return result
    })
}

export const getPost = ({id, use_fields_for_manually_approved_lookup = false}) => {
  const params = {ids: id}
  if (use_fields_for_manually_approved_lookup) {
    params.fields = post_fields_for_manually_approved_lookup.join(',')
  }
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
export const commentsByThreadReturnValueDefaults = { comments: {}, last: undefined }
export const getCommentsByThread = (link_id, since='') => {
  const queryParams = {
    link_id: toBase10(link_id),
    limit: PUSHSHIFT_API_MAX_QUERY_SIZE,
    sort: 'created_utc',
    order: 'asc',
    ...(since && {since})
    // disable until field names in new Pushshift API are established
    //fields: comment_fields.join(','),
  }
  return fetchUrlWithParams(commentURL, queryParams)
    .then(response => response.json())
    .then(data => {
      let last = undefined
      const comments = data.data.reduce((map, comment) => {
        update_retrieved_field(comment)
        // Missing parent id === direct reply to thread
        if ((! ('parent_id' in comment)) || ! comment.parent_id) {
          comment.parent_id = 't3_'+link_id
        } else if (typeof comment.parent_id === 'number') {
          comment.parent_id = 't1_'+toBase36(comment.parent_id)
        }
        map[comment.id] = comment
        last = comment.created_utc
        return map
      }, {})
      return {comments, last} // if this changes, update commentsByThreadReturnValueDefaults above
    })
}
