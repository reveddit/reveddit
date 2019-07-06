import {
  queryUserPage,
  getItems as getRedditItemsByID,
  usernameAvailable,
  userPageHTML
} from 'api/reddit'
import {
  getAutoremovedItems
} from 'api/pushshift'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import { itemIsRemovedOrDeleted, isComment, isPost, SimpleURLSearchParams } from 'utils'


export const getQueryParams = () => {
  const result = {
                  sort: 'new', before: '', after: '', limit: 100,
                  loadAll: false, searchPage_after: '', show:''}
  const queryParams = new SimpleURLSearchParams(window.location.search);

  if (queryParams.has('all')) { result.loadAll = true }

  ['sort', 'before', 'after', 'limit', 'searchPage_after', 'show'].forEach(p => {
    if (queryParams.has(p)) {
      result[p] = queryParams.get(p)
    }
  })

  return result
}


function lookupAndSetRemovedBy(global) {
  // comment_ids = comments where (removedby === undefined)
  // post_ids = post where (removedby === undefined)
  // query pushshift for comment_ids where author === '[deleted]'
     //.then(1. markComments; 2. setState(comments_removed_meta: {mod-rem: {}, automod-rem: {}, unknown-rem: {}, automod-rem-mod-app: {}}))
  // query pushshift for post_ids where is_crosspostable === false
    //.then(1. markComments; 2. setState(posts_removed_meta: {mod-rem: {}, automod-rem: {}, unknown-rem: {}, automod-rem-mod-app: {}}))
  // render() in user/Comment.js
  const comment_names = []
  const post_names = []
  const comments_removedBy_undefined = []
  const posts_removedBy_undefined = []
  const gs = global.state
  gs.items.forEach(item => {
    if (item.removedby === undefined && ! item.unknown) {
      if (isComment(item)) {
        comments_removedBy_undefined.push(item)
        comment_names.push(item.name)
      } else if (isPost(item)) {
        posts_removedBy_undefined.push(item)
        post_names.push(item.name)
      }
    }
  })
  let comments_promise = Promise.resolve()
  if (comments_removedBy_undefined.length) {
      comments_promise = getAutoremovedItems(comment_names).then(ps_comments_autoremoved => {
      const removed_meta = setRemovedBy(comments_removedBy_undefined, ps_comments_autoremoved)
    })
    .catch(global.setError)
  }
  let posts_promise = Promise.resolve()
  if (posts_removedBy_undefined.length) {
      posts_promise = getAutoremovedItems(post_names).then(ps_posts_autoremoved => {
      const removed_meta = setRemovedBy(posts_removedBy_undefined, ps_posts_autoremoved)
    })
    .catch(global.setError)
  }

  return Promise.all([comments_promise, posts_promise])
}

// this can handle posts or comments but not both together
// should change ps_autoremoved_map key if want to do both at same time
// - the fix: check for existence of a field that's always existed in one
//      but not the other, e.g. link_id is in all PS comments and not in submissions
function setRemovedBy(items_removedBy_undefined, ps_items_autoremoved) {
  const removed_meta = {}
  const ps_autoremoved_map = {}
  ps_items_autoremoved.forEach(c => {
    ps_autoremoved_map[c.id] = c
  })
  items_removedBy_undefined.forEach(item => {
    const ps_item = ps_autoremoved_map[item.id]
    if (ps_item) {
      const retrievalLatency = ps_item.retrieved_on-ps_item.created_utc
      if (item.removed) {
        if (retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD) {
          item.removedby = AUTOMOD_REMOVED
          removed_meta[name] = AUTOMOD_REMOVED
        } else {
          item.removedby = UNKNOWN_REMOVED
          removed_meta[name] = UNKNOWN_REMOVED
        }
      } else {
        item.removedby = AUTOMOD_REMOVED_MOD_APPROVED
        removed_meta[name] = AUTOMOD_REMOVED_MOD_APPROVED
      }
    } else if (item.removed) {
      item.removedby = MOD_OR_AUTOMOD_REMOVED
      removed_meta[name] = MOD_OR_AUTOMOD_REMOVED
    } else {
      item.removedby = NOT_REMOVED
      removed_meta[name] = NOT_REMOVED
    }
  })
  return removed_meta
}

export const getRevdditUserItems = (user, kind, qp, global, history) => {
  global.setLoading('')
  const gs = global.state
  return getItems(user, kind, global, qp.sort, qp.before, qp.after || gs.userNext, qp.limit, qp.loadAll)
  .then(result => {
    return lookupAndSetRemovedBy(global)
    .then( tempres => {
      global.setSuccess()
      return result
    })
  })
}

function getItems (user, kind, global, sort, before = '', after = '', limit, loadAll = false) {
  const gs = global.state
  return queryUserPage(user, kind, sort, before, after, limit)
  .then(userPageData => {
    if ('error' in userPageData) {
      if (userPageData.error == 404) {
        return usernameAvailable(user)
        .then(result => {
          if (result === true) {
            global.setError(Error(''), {userIssueDescription: 'does not exist'})
          } else {
            return userPageHTML(user)
            .then(html_result => {
              if ('error' in html_result) {
                console.error(html_result.error)
                global.setError(Error(''), {userIssueDescription: 'deleted or shadowbanned'})
              } else if (html_result.html.match(/has deleted their account/)) {
                global.setError(Error(''), {userIssueDescription: 'deleted'})
              } else {
                global.setError(Error(''), {userIssueDescription: 'shadowbanned'})
              }
              return null
            })
          }
        })
      } else if ('message' in userPageData && userPageData.message.toLowerCase() == 'forbidden') {
        global.setError(Error(''), {userIssueDescription: 'suspended'})
      }
    }
    const num_pages = gs.num_pages+1
    const userPage_item_lookup = {}
    const ids = []
    const items = gs.items
    userPageData.items.forEach(item => {
      userPage_item_lookup[item.name] = item
      ids.push(item.name)
      if (isPost(item)) {
        item.selftext = ''
      }
      if (items.length > 0) {
        item.prev = items[items.length-1].name
      }
      items.push(item)
    })
    items.slice().reverse().forEach((item, index, array) => {
      if (index > 0) {
        item.next = array[index-1].name
      }
    })

    return getRedditItemsByID(ids)
    .then(redditInfoItems => {
      redditInfoItems.forEach(item => {
        if (itemIsRemovedOrDeleted(item)) {
          userPage_item_lookup[item.name].removed = true
        }
      })
      global.setState({items, num_pages, userNext: userPageData.after})
      if (userPageData.after && loadAll) {
        return getItems(user, kind, global, sort, '', userPageData.after, limit, loadAll)
      }
      return userPageData.after
    })
  })
}
