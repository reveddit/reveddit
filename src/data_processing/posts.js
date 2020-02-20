import { getPosts as getRedditPosts } from 'api/reddit'
import { getAuth } from 'api/reddit/auth'
import {
  getPostsBySubredditOrDomain as pushshiftGetPostsBySubredditOrDomain,
  queryPosts as pushshiftQueryPosts
} from 'api/pushshift'
import { itemIsRemovedOrDeleted, postIsDeleted, display_post,
         getUniqueItems, SimpleURLSearchParams
} from 'utils'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED, USER_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

export const byScore = (a, b) => {
  return (b.stickied - a.stickied) || (b.score - a.score)
      || (b.num_comments - a.num_comments)
}
export const byDate = (a, b) => {
  return (b.stickied - a.stickied) || (b.created_utc - a.created_utc)
      || (b.num_comments - a.num_comments)
}
export const byNumComments = (a, b) => {
  return (b.stickied - a.stickied) || (b.num_comments - a.num_comments)
      || (b.created_utc - a.created_utc)
}
export const byControversiality = (a, b) => {
  return (b.stickied - a.stickied) || (a.score - b.score)
      || (b.num_comments - a.num_comments)
}
export const byNumCrossposts = (a, b) => {
  if ('num_crossposts' in a && 'num_crossposts' in b) {
    return (b.num_crossposts - a.num_crossposts) || (b.num_comments - a.num_comments)
        || (b.created_utc - a.created_utc)
  } if ('num_crossposts' in a) {
    return -1
  } else if ('num_crossposts' in b) {
    return 1
  } else {
    return (b.created_utc - a.created_utc)
  }
}

export const retrieveRedditPosts_and_combineWithPushshiftPosts = (pushshiftPosts, includePostsWithZeroComments = false) => {
  return getRedditPosts({objects: pushshiftPosts})
  .then(redditPosts => {
    return combinePushshiftAndRedditPosts(pushshiftPosts, Object.values(redditPosts), includePostsWithZeroComments)
  })
}

export const getRevdditPosts = (pushshiftPosts) => {
  return retrieveRedditPosts_and_combineWithPushshiftPosts(pushshiftPosts)
}

export const combinePushshiftAndRedditPosts = (pushshiftPosts, redditPosts, includePostsWithZeroComments = false, isInfoPage = false) => {
  const redditPosts_lookup = {}
  redditPosts.forEach(post => {
    redditPosts_lookup[post.id] = post
  })
  const pushshiftPosts_lookup = {}
  const missingPosts = []
  pushshiftPosts.forEach(post => {
    pushshiftPosts_lookup[post.id] = post
    if (! redditPosts_lookup[post.id]) {
      missingPosts.push(post.id)
    }
  })
  if (missingPosts.length) {
    console.log('missing posts: '+missingPosts.join(' '))
  }
  const show_posts = []
  redditPosts.forEach(reddit_post => {
    const ps_post = pushshiftPosts_lookup[reddit_post.id]
    const post = combineRedditAndPushshiftPost(reddit_post, ps_post)
    post.selftext = ''
    if (post.deleted || post.removed) {
      if (  (    post.num_comments > 0
              || includePostsWithZeroComments)
            || post.removed) {
        display_post(show_posts, post, ps_post, isInfoPage)
      }
    } else {
      show_posts.push(post)
    }
  })
  return show_posts
}

export const combineRedditAndPushshiftPost = (post, ps_post) => {
  let retrievalLatency = undefined
  if (ps_post) {
    retrievalLatency = ps_post.retrieved_on-ps_post.created_utc
  }
  if (post.crosspost_parent_list) {
    post.num_crossposts += post.crosspost_parent_list.reduce((total,x) => total+x.num_crossposts,0)
  }
  if (itemIsRemovedOrDeleted(post)) {
    if (postIsDeleted(post)) {
      post.deleted = true
      post.selftext = ''
      post.removedby = USER_REMOVED
    } else {
      post.removed = true
      if (ps_post && 'is_robot_indexable' in ps_post && ! ps_post.is_robot_indexable) {
        if (retrievalLatency !== undefined && retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD) {
          post.removedby = AUTOMOD_REMOVED
        } else {
          post.removedby = UNKNOWN_REMOVED
        }
      } else if (! ps_post || ! ('is_robot_indexable' in ps_post)) {
        post.removedby = UNKNOWN_REMOVED
      } else {
        post.removedby = MOD_OR_AUTOMOD_REMOVED
      }
    }
  } else {
    if (ps_post && 'is_robot_indexable' in ps_post && ! ps_post.is_robot_indexable) {
      post.removedby = AUTOMOD_REMOVED_MOD_APPROVED
    } else {
      post.removedby = NOT_REMOVED
    }
  }
  return post
}

const reduceDomain = (map, e) => {
  if (e.split('.').length > 1) {
    map[e] = 1
    const base = e.replace(/^www\./i,'')
    map[base] = 1
    if (base.split('.').length-1 == 1) {
      map['www.'+base] = 1
    }
    if (base in youtube_aliases) {
      Object.keys(youtube_aliases).forEach(alias => {
        map[alias] = 1
      })
    }
  }
  return map
}

export const getRevdditPostsByDomain = (domain, global) => {
  const {n, before, before_id, selfposts} = global.state
  global.setLoading('')
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    window.history.replaceState(null,null,`/r/${domain}/`+window.location.search)
  }
  const domains = Object.keys(domain.split('+').reduce(reduceDomain, {}))
  if (domains.length) {
    const promises = [pushshiftGetPostsBySubredditOrDomain({domain:domains.join('+'), n, before, before_id})]
    const addQuery = selfposts && domains.length
    if (addQuery) {
      promises.push(pushshiftQueryPosts({selftext:domains.join('|')}))
    }
    return Promise.all(promises)
    .then(results => {
      if (addQuery) {
        return results[0].concat(results[1])
      } else {
        return results[0]
      }
    })
    .then(retrieveRedditPosts_and_combineWithPushshiftPosts)
    .then(show_posts => {
      global.setSuccess({items:show_posts})
      return show_posts
    })
  } else {
    global.setError('')
  }
}

const getMinimalPostPath = (path) => {
  return path.split('/').slice(0,5).join('/')
}

const youtube_aliases = {
  'youtu.be':1,'www.youtu.be':1,'www.youtube.com':1,'youtube.com':1,'m.youtube.com':1
}

const getYoutubeURL = (id) => {
  return `((${Object.keys(youtube_aliases).join('|')}) ${id})`
}

const getUrlMeta = (url) => {
  const redditlikeDomainStripped = url.replace(/^https?:\/\/[^/]*(reddit\.com|removeddit\.com|ceddit\.com|unreddit\.com|snew\.github\.io|snew\.notabug\.io|politicbot\.github\.io|r\.go1dfish\.me|reve?ddit\.com)/i,'')
  const isRedditDomain = redditlikeDomainStripped.match(/^\//)
  const isRedditPostURL = redditlikeDomainStripped.match(/^\/r\/[^/]*\/comments\/[a-z0-9]/i)
  let normalizedPostURLs = [url]
  const isYoutubeURL = url.match(/^https?:\/\/(?:www\.|m\.)?(youtube\.com|youtu\.be)(\/.+)/i)
  if (isRedditPostURL) {
    normalizedPostURLs = [getMinimalPostPath(redditlikeDomainStripped)]
  } else if (isYoutubeURL && isYoutubeURL[2]) {
    if (isYoutubeURL[1] === 'youtube.com') {
      const params = new SimpleURLSearchParams(isYoutubeURL[2].split('?')[1])
      const v = params.get('v')
      if (v) {
        normalizedPostURLs = [getYoutubeURL(v)]
      }
    } else {
      normalizedPostURLs = [getYoutubeURL(isYoutubeURL[2].split('?')[0])]
    }
  }
  const postURL_ID = redditlikeDomainStripped.split('/')[4]
  return {isRedditDomain, isRedditPostURL, normalizedPostURLs, postURL_ID}
}

export const getRevdditDuplicatePosts = async (threadID, global) => {
  global.setLoading('')
  const auth = await getAuth()
  return getRedditPosts({ids: threadID.split('+'), auth})
  .then(async redditPosts => {
    const promises = []
    const urls = []
    const selftext_urls = []
    const secondary_lookup_ids_set = {}
    Object.values(redditPosts).forEach(drivingPost => {
      const {isRedditDomain, isRedditPostURL, normalizedPostURLs, postURL_ID} = getUrlMeta(drivingPost.url)
      urls.push(...normalizedPostURLs)
      if (isRedditPostURL) {
        secondary_lookup_ids_set[postURL_ID] = true
      } else {
        const minimalPostPath = getMinimalPostPath(drivingPost.permalink)
        urls.push(minimalPostPath)
        selftext_urls.push(minimalPostPath)
      }
      if (! isRedditDomain || isRedditPostURL) {
        selftext_urls.push(...normalizedPostURLs)
      }
    })
    const secondary_lookup_ids = Object.keys(secondary_lookup_ids_set)
    if (secondary_lookup_ids.length) {
      Object.values(await getRedditPosts({ids: secondary_lookup_ids, auth})).forEach(secondary_post => {
        const {isRedditPostURL: isRedditPostURL_2, normalizedPostURLs: normalizedPostURLs_2} = getUrlMeta(secondary_post.url)
        if (isRedditPostURL_2) {
          urls.push(...normalizedPostURLs_2)
        } else {
          urls.push(secondary_post.url)
        }
      })
    }
    if (urls.length) {
      promises.push(pushshiftQueryPosts({url: urls.join('|')}))
    }
    if (selftext_urls.length) {
      promises.push(
        pushshiftQueryPosts(
          {selftext:
            selftext_urls.map(u => {
              if (u.match(/^\(/)) {
                return u
              } else {
                return '"'+u+'"'
              }
            }).join('|')
          }
        ))
    }
    return Promise.all(promises)
    .then(results => {
      if (results.length === 1) {
        return results[0]
      } else {
        return getUniqueItems(results)
      }
    })
    .then((pushshiftPosts) => retrieveRedditPosts_and_combineWithPushshiftPosts(pushshiftPosts, true))
    .then(items => {
      global.setSuccess({items})
      return items
    })
  })
}
