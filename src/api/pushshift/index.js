import { toBase10, toBase36 } from 'utils'

const postURL = 'https://elastic.pushshift.io/rs/submissions/_search?source='
const commentURL = 'https://elastic.pushshift.io/rc/comments/_search?source='
const comment_fields = [
  'author', 'body', 'created_utc', 'parent_id', 'score',
  'subreddit', 'link_id', 'author_flair_text', 'retrieved_on'
]

export const getRecentPostsBySubreddit = (subreddits_str, n = 1000) => {
  const subreddits = subreddits_str.toLowerCase().split(',')
  const elasticQuery = {
    size:n,
    query: {
      bool: {
        filter: {
          terms: {
            subreddit: subreddits
          }
        }
      }
    },
    sort: {
      ['created_utc']: 'desc'
    },
    _source: ['retrieved_on','created_utc', 'is_crosspostable']
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

export const getRecentCommentsBySubreddit = (subreddits_str, n = 1000) => {
  const subreddits = subreddits_str.toLowerCase().split(',')
  const elasticQuery = {
    size:n,
    query: {
      bool: {
        filter: {
          terms: {
            subreddit: subreddits
          }
        }
      }
    },
    sort: {
      ['created_utc']: 'desc'
    },
    _source: comment_fields
  }
  if (subreddits_str === 'all') {
    delete(elasticQuery.query.bool)
  }
  return window.fetch(commentURL + JSON.stringify(elasticQuery))
    .then(response => response.json())
    .then(data => {
      return data.hits.hits.map( comment => {
        const id = toBase36(comment._id)
        comment._source.id = id
        comment._source.name = 't1_'+id
        return comment._source
      })
    })
    .catch(() => { throw new Error('Unable to access Pushshift, cannot load recent comments') })
}

// supply either comments or posts using fullname of id (t1_+id or t3_+id)
// note: if a post is old, pushshift will not have the is_crosspostable field..
//       technically, this should be marked as removedby='unknown'
//       to simplify logic, in pages/user/index.js, marking this as removed by 'mod (or automod)'
export const getAutoremovedItems = names => {
  let filter_field = 'author'
  if (names[0].slice(0,2) === 't3') {
    filter_field = 'is_crosspostable'
  }
  const ids_base10 = names.map(name => toBase10(name.slice(3)))
  const elasticQuery = {
    size:5003,
    query: {
      bool: {
        filter: [
          {'terms': {
            '_id': ids_base10
          }}
        ]
      }
    },
    _source: ['retrieved_on','created_utc', filter_field]
  }
  let filter_term = {[filter_field]: '[deleted]'}
  let url = commentURL
  let isPostQuery = false
  if (names[0].slice(0,2) === 't1') {
    elasticQuery.query.bool.filter.push({'term': filter_term})
  } else if (names[0].slice(0,2) === 't3') {
    //filter_field = 'is_crosspostable'
    //filter_term = {[filter_field]: false}
    isPostQuery = true
    url = postURL
  }

  return window.fetch(url + JSON.stringify(elasticQuery))
    .then(response => response.json())
    .then(data => {
      const items = []
      data.hits.hits.forEach( item => {
        if (! isPostQuery ||
            (isPostQuery &&
              ( 'is_crosspostable' in item._source &&
              ! item._source.is_crosspostable))) {
          item._source.id = toBase36(item._id);
          items.push(item._source);
        }
      })
      return items
    })
    .catch(() => { throw new Error('Unable to access Pushshift, cannot load removed-by labels') })
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
    const post = response.hits.hits[0]._source
    post.id = toBase36(post.id)
    return post
  })
  .catch(() => { throw new Error('Could not get removed post') })
}

export const getComments = threadID => {
  const elasticQuery = {
    query: {
      match: {
        link_id: toBase10(threadID)
      }
    },
    size: 20000,
    _source: comment_fields
  }

  return window.fetch(commentURL + JSON.stringify(elasticQuery))
  .then(response => response.json())
  .then(response => {
    const comments = response.hits.hits
    return comments.map(comment => {
      comment._source.id = toBase36(comment._id)
      comment._source.link_id = toBase36(comment._source.link_id)

      // Missing parent id === direct reply to thread
      if (!comment._source.parent_id) {
        comment._source.parent_id = threadID
      } else {
        comment._source.parent_id = toBase36(comment._source.parent_id)
      }

      return comment._source
    })
  })
  .catch(() => { throw new Error('Could not get removed comments') })
}
