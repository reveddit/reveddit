import {
  getPostsBySubredditOrDomain as pushshiftGetPostsBySubredditOrDomain,
  PUSHSHIFT_MAX_COUNT_PER_QUERY,
} from 'api/pushshift'
import { getRemovedPostIDs } from 'api/removeddit'
import { getPosts as getRedditPosts,
         getSubredditAbout
} from 'api/reddit'
import { getModlogsPromises } from 'api/common'
import { postIsDeleted } from 'utils'
import { retrieveRedditPosts_and_combineWithPushshiftPosts } from 'data_processing/posts'
import { copyModlogItemsToArchiveItems, setSubredditMeta } from 'data_processing/comments'
import { PATHS_STR_SUB, sortCreatedAsc } from 'utils'

export const getRevdditPostsBySubreddit = async (subreddit, global) => {
  const {n, before, before_id, after, frontPage, page} = global.state
  // /r/sub/new , /r/sub/controversial etc. are not implemented, so change path to indicate that
  if (window.location.pathname.match(new RegExp('^/['+PATHS_STR_SUB+']/([^/]*)/.+'))) {
    window.history.replaceState(null,null,`/v/${subreddit}/`+window.location.search)
  }
  if (subreddit === 'all' || frontPage) {
    return getRemovedPostIDs(subreddit, page || 1)
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
      posts_array.sort(sortCreatedAsc)
      return global.returnSuccess({items: posts_array, itemsSortedByDate:posts_array})
    })
    .catch(global.returnError)
  } else {
    const {subreddit_about_promise} = await setSubredditMeta(subreddit, global)
    const modlogs_promises = await getModlogsPromises(subreddit, 'posts')
    return combinedGetPostsBySubredditOrDomain({global, subreddit, n, before, before_id, after,
      subreddit_about_promise, modlogs_promises})
    .then(global.returnSuccess)
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
const empty_modlogs_promises = [empty_obj_promise]

export const combinedGetItemsBySubredditOrDomain = (args) => {
  const {global, subreddit, domain, n, before, before_id, after,
    numItemsQueried = 0,
    combinePromise = empty_arr_promise,
    subreddit_about_promise = empty_obj_promise,
    modlogs_promises = empty_modlogs_promises,
    prev_last_id,
    pushshiftQueryFn,
    postProcessCombine_Fn, postProcessCombine_Args,
    postProcessCombine_ItemsArgName,
  } = args
  const usingAfter = after && ! before
  return pushshiftQueryFn({subreddit, domain, n, before, before_id, after})
  .catch(error => {return []}) // if ps is down, can still return modlog results
  .then(pushshiftItemsUnfiltered => {
    // make sure previous promise completes b/c it sets state
    const newCombinePromise = combinePromise.then(() => {
      const {items, itemsLookup} = global.state
      let {oldestTimestamp, newestTimestamp} = global.state
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
      if (pushshiftItemsUnfiltered.length) {
        const first_created_utc = pushshiftItemsUnfiltered[0].created_utc
        const last_created_utc = pushshiftItemsUnfiltered[pushshiftItemsUnfiltered.length-1].created_utc
        if (! usingAfter) {
          if (! newestTimestamp) {
            newestTimestamp = first_created_utc
          }
          oldestTimestamp = last_created_utc
        } else {
          newestTimestamp = first_created_utc
          if (! oldestTimestamp) {
            oldestTimestamp = last_created_utc
          }
        }
      }
      if (before_id && ! foundStartingPoint) {
        console.error('data displayed is an approximation, starting id not found in first set of results: '+before_id)
        pushshiftItems = pushshiftItemsAll
        if (! newestTimestamp && pushshiftItemsUnfiltered.length) {
          newestTimestamp = pushshiftItemsUnfiltered[0].created_utc
        }
      }
      return Promise.all(modlogs_promises)
      .then(async results => {
        for (const modlogsItems of results) {
          if (Object.keys(modlogsItems).length)
          Object.values(modlogsItems).forEach(item => {
            itemsLookup[item.id] = item
          })
          copyModlogItemsToArchiveItems(modlogsItems, pushshiftItems)
        }
        const combinedItems = await postProcessCombine_Fn({[postProcessCombine_ItemsArgName]: pushshiftItems, subreddit_about_promise})
        const allItems = items.concat(combinedItems)
        return global.setState({items: items.concat(combinedItems), itemsLookup, oldestTimestamp, newestTimestamp})
        .then(() => allItems) // need this return value here for posts.js -> getRevdditPostsByDomain()
      })
    })
    const newNumItemsQueried = numItemsQueried+pushshiftItemsUnfiltered.length
    // need the prev_last_id condition b/c of the way
    // querying pushshift by date works. must query by the timestamp, and to get all results,
    // you end up at least including the last result from the previous set.
    // (There may be two posts/comments made in the same second, one of which may have
    // been cut off by the previous query's length limit.)
    // Without this condition, the code infinitely queries pushshift when reaching the
    // last set of results for the subreddit.
    if (pushshiftItemsUnfiltered.length &&
        ! (pushshiftItemsUnfiltered.length === 1 &&
           prev_last_id && pushshiftItemsUnfiltered[0].id === prev_last_id
          ) &&
        ! (after && pushshiftItemsUnfiltered.length < PUSHSHIFT_MAX_COUNT_PER_QUERY) &&
        newNumItemsQueried < n) {
        const first = pushshiftItemsUnfiltered[0]
        const last = pushshiftItemsUnfiltered[pushshiftItemsUnfiltered.length - 1]
      // unset before_id and modlogs_promises: they only need to be used once.
      // if pushshift supports before_id in the future, duplicate checking above is not needed
      const beforeAfter = {}
      if (! usingAfter) {
        beforeAfter.before = last.created_utc
      } else {
        beforeAfter.after = first.created_utc
      }
      return combinedGetItemsBySubredditOrDomain({...args,
        ...beforeAfter,
        before_id: undefined,
        numItemsQueried: newNumItemsQueried,
        combinePromise: newCombinePromise, subreddit_about_promise,
        modlogs_promises: empty_modlogs_promises,
        prev_last_id: last.id,
      })
    } else {
      return newCombinePromise
    }
  })
}
