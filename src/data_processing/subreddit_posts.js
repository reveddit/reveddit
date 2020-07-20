import {
  getPostsBySubredditOrDomain as pushshiftGetPostsBySubredditOrDomain
} from 'api/pushshift'
import { getRemovedPostIDs } from 'api/removeddit'
import { getPosts as getRedditPosts,
         getModerators, getSubredditAbout, getModlogsPosts
} from 'api/reddit'
import { postIsDeleted } from 'utils'
import { retrieveRedditPosts_and_combineWithPushshiftPosts } from 'data_processing/posts'
import { copyModlogItemsToArchiveItems } from 'data_processing/comments'

export const getRevdditPostsBySubreddit = (subreddit, global) => {
  const {n, before, before_id, frontPage} = global.state
  // /r/sub/new , /r/sub/controversial etc. are not implemented, so redirect
  if (window.location.pathname.match(/^\/r\/([^/]*)\/.+/g)) {
    window.history.replaceState(null,null,`/r/${subreddit}/`+window.location.search)
  }
  if (subreddit === 'all') {
    return getRemovedPostIDs(subreddit)
    .then(ids => getRedditPosts({ids}))
    .then(posts => {
      const posts_array = Object.values(posts)
      posts_array.forEach(post => {
        post.selftext = ''
        if (postIsDeleted(post)) {
          post.deleted = true
        } else {
          post.removed = true
        }
      })
      global.setSuccess({items: posts_array})
      return posts
    })
    .catch(global.setError)
  } else {
    if (frontPage) {
      global.selection_update('frontPage', false, '')
    }
    const subreddit_lc = subreddit.toLowerCase()
    const moderators_promise = getModerators(subreddit)
    .then(moderators => {
      global.setState({moderators: {[subreddit_lc]: moderators}})
    })
    const subreddit_about_promise = getSubredditAbout(subreddit)
    const modlogs_promise = getModlogsPosts(subreddit)
    return combinedGetPostsBySubredditOrDomain({subreddit, n, before, before_id, global,
      subreddit_about_promise, modlogs_promise})
    .then(() => {
      global.setSuccess()
    })
  }
}

export const combinedGetPostsBySubredditOrDomain = (args) => {
  return combinedGetItemsBySubredditOrDomain({...args,
    pushshiftQueryFn: pushshiftGetPostsBySubredditOrDomain,
    postProcessCombine_Fn: retrieveRedditPosts_and_combineWithPushshiftPosts,
    postProcessCombine_ItemsArgName: 'pushshiftPostsObj',
  })
}

const empty_arr_promise = Promise.resolve([])
const empty_obj_promise = Promise.resolve({})
const empty_modlogs_promise = empty_obj_promise

export const combinedGetItemsBySubredditOrDomain = (args) => {
  const {subreddit, n, before, before_id, global,
    numItemsQueried = 0,
    combinePromise = empty_arr_promise,
    subreddit_about_promise = empty_obj_promise,
    modlogs_promise = empty_modlogs_promise,
    pushshiftQueryFn,
    postProcessCombine_Fn, postProcessCombine_Args,
    postProcessCombine_ItemsArgName,
  } = args
  return pushshiftQueryFn({subreddit, n, before, before_id})
  .catch(error => {return []}) // if ps is down, can still return modlog results
  .then(pushshiftItemsUnfiltered => {
    // make sure previous promise completes b/c it sets state
    const newCombinePromise = combinePromise.then(() => {
      const {items, itemsLookup} = global.state
      let foundStartingPoint = false
      let pushshiftItems = {}, pushshiftItemsAll = {}
      // this loop does duplicate checking b/c pushshift does not support before_id.
      // pushshiftItemsUnfiltered must be ordered as date desc
      for (const item of pushshiftItemsUnfiltered) {
        if (before_id && item.id === before_id) {
          foundStartingPoint = true
        }
        if (!(item.id in itemsLookup)) {
          pushshiftItemsAll[item.id] = item
          if (! before_id || foundStartingPoint) {
            pushshiftItems[item.id] = item
            itemsLookup[item.id] = item
          }
        }
      }
      if (before_id && ! foundStartingPoint) {
        console.error('data displayed is an approximation, starting id not found in first set of results: '+before_id)
        pushshiftItems = pushshiftItemsAll
      }
      return modlogs_promise.then(modlogsItems => {
        Object.values(modlogsItems).forEach(item => {
          itemsLookup[item.id] = item
        })
        copyModlogItemsToArchiveItems(modlogsItems, pushshiftItems)
        return postProcessCombine_Fn(
          {[postProcessCombine_ItemsArgName]: pushshiftItems, subreddit_about_promise})
        .then(combinedItems => {
          return global.setState({items: items.concat(combinedItems), itemsLookup})
        })
      })
    })
    if (pushshiftItemsUnfiltered.length && numItemsQueried+pushshiftItemsUnfiltered.length < n) {
      const last = pushshiftItemsUnfiltered[pushshiftItemsUnfiltered.length - 1]
      // unset before_id and modlogs_promise: they only need to be used once.
      // if pushshift supports before_id in the future, duplicate checking above is not needed
      return combinedGetItemsBySubredditOrDomain({...args,
        before:last.created_utc,
        before_id: undefined,
        numItemsQueried: numItemsQueried+pushshiftItemsUnfiltered.length,
        combinePromise: newCombinePromise, subreddit_about_promise,
        modlogs_promise: empty_modlogs_promise,
      })
    } else {
      return newCombinePromise
    }
  })
}
