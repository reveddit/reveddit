import {
  queryUserPageCombined,
  usernameAvailable,
  userPageHTML,
  getModeratedSubreddits,
  www_reddit,
  OVERVIEW, SUBMITTED, COMMENTS, GILDED,
} from 'api/reddit'
import { getMissingComments } from 'api/reveddit'
import {
  getAutoremovedItems
} from 'api/pushshift'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import { itemIsRemovedOrDeleted, isComment, isPost, SimpleURLSearchParams,
} from 'utils'
import { setPostAndParentDataForComments } from 'data_processing/info'
import { setMissingCommentMeta } from 'data_processing/missing_comments'

const verify = 'Verify the url and reload this page to double check. '
const deleted_shadowbanned_notexist = 'may be deleted, shadowbanned, or may not exist. '

function lookupAndSetRemovedBy(global) {
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
      item.removedby = UNKNOWN_REMOVED
      removed_meta[name] = UNKNOWN_REMOVED
    } else {
      item.removedby = NOT_REMOVED
      removed_meta[name] = NOT_REMOVED
    }
  })
  return removed_meta
}
const blankMissingComments = {comments: {}}
let missing_comments_promise = Promise.resolve(blankMissingComments)

const acceptable_kinds = [OVERVIEW, COMMENTS, SUBMITTED, GILDED, '']
const acceptable_sorts = ['new', 'top', 'controversial', 'hot']

//isFirstTimeLoading is true on page load, false when: 'load all' or 'view more' is clicked
//  scrolling to load more is handled by calling getItems directly, so isFirstTimeLoading
//  becomes irrelevant and incorrect there
export const getRevdditUserItems = async (user, kind, global, isFirstTimeLoading = true) => {
  const gs = global.state
  let {sort, before, after, t, limit, all} = gs
  if (all) {
    limit = 100
  }
  const pathParts = window.location.pathname.split('/')
  const badKind = ! acceptable_kinds.includes(kind)
  const badSort = ! acceptable_sorts.includes(sort)
  const badPath = pathParts.length > 5
  if (badKind || badSort || badPath) {
    let path = pathParts.slice(0,4).join('/')
    const params = new SimpleURLSearchParams(window.location.search)
    if (badKind) {
      kind = ''
      path = pathParts.slice(0,3).join('/')
    }
    if (badSort) {
      params.delete('sort')
      sort = 'new'
    }
    if (path.slice(-1) !== '/') {
      path += '/'
    }
    window.history.replaceState(null,null,path+params.toString()+window.location.hash)
  }
  // only request missing comments once. this will always resolve immediately
  await missing_comments_promise.then(({comments}) => {
    if (Object.keys(comments).length === 0) {
      missing_comments_promise = getMissingComments({limit: 200})
      .catch(() => {
        return blankMissingComments
      })
    }
  })
  if (isFirstTimeLoading) {
    getModeratedSubreddits(user).then(moderated_subreddits => global.setState({moderated_subreddits}))
  }
  const params_pre_after = [user, kind, global, sort, before]
  const params_post_after = [t, limit, all]
  return getItems(...params_pre_after, after || gs.userNext, ...params_post_after)
  .then( async (pageLoad_or_loadAll_or_viewMore_userPageNext) => {
    if ((isFirstTimeLoading && ! all) || (all && ! pageLoad_or_loadAll_or_viewMore_userPageNext)) {
      await lookupAndSetRemovedBy(global)
    }
    window.onscroll = (ev) => {
      const {loading, userNext, show} = global.state
      if (userNext && ! loading && ! show && (window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 2) {
        global.setLoading('')
        .then(() => {
          getItems(...params_pre_after, userNext, ...params_post_after)
          .then(() => {
            const {userNext: updated_userNext, items} = global.state
            // on scroll load, call pushshift if page # is > 1 and there are no more pages
            if (! updated_userNext && items.length > 100) {
              return lookupAndSetRemovedBy(global)
              .then(() => global.setSuccess())
            } else {
              return global.setSuccess()
            }
          })
        })
      }
    }
    const returnFunc = isFirstTimeLoading ? global.returnSuccess : global.setSuccess
    return returnFunc()
  })
}

const getItems = async (user, kind, global, sort, before = '', after = '', time, limit, all = false) => {
  const gs = global.state
  const {commentParentsAndPosts, userCommentsByPost} = gs
  let {oldestTimestamp, newestTimestamp} = gs
  let quarantined_subreddits
  if (gs.items.length) {
    const last = gs.items[gs.items.length - 1]
    if (last.quarantine) {
      quarantined_subreddits = last.subreddit
    }
  }
  const data = await queryUserPageCombined({user, kind, sort, before, after, t: time, limit, quarantined_subreddits})
  const userPageData = data.user
  if ('error' in data) {
    if (data.error == 404) {
      const avail = await usernameAvailable(user)
      if (avail === true) {
        global.setError({userIssueDescription: 'does not exist'})
      } else {
        const html_result = await userPageHTML(user)
        const status = `You can also check account status at <a href="${www_reddit}/user/${user}" rel="noopener">/u/${user}</a> or <a href="${www_reddit}/r/ShadowBan" rel="noopener">/r/ShadowBan</a>.`
        if ('error' in html_result) {
          console.error(html_result.error)
          global.setError({userIssueDescription: deleted_shadowbanned_notexist+verify+status})
        } else if (html_result.html.match(/has deleted their account/)) {
          global.setError({userIssueDescription: 'has deleted their account'})
        } else if (html_result.html.match(/must be 18/)) {
          global.setError({userIssueDescription: deleted_shadowbanned_notexist+verify+status})
        } else {
          global.setError({userIssueDescription: 'may be shadowbanned or may not exist. '+verify+status})
        }
      }
      return null
    } else if ('message' in data && data.message.toLowerCase() == 'forbidden') {
      return global.setError({userIssueDescription: 'suspended'})
    }
  }
  const {comments: missingComments} = await missing_comments_promise
  const num_pages = gs.num_pages+1
  const userPage_item_lookup = {}
  const ids = [], comments = []
  const items = gs.items
  userPageData.items.forEach((item, i) => {
    userPage_item_lookup[item.name] = item
    item.rev_position = items.length + i
    ids.push(item.name)
    if (! oldestTimestamp) {
      if (! item.stickied || ! userPageData.after) {
        oldestTimestamp = item.created_utc
      }
      newestTimestamp = item.created_utc
    } else if (item.created_utc > newestTimestamp) {
      newestTimestamp = item.created_utc
    } else if (item.created_utc < oldestTimestamp) {
      // item.stickied is never true here b/c stickied items appear first in the list
      oldestTimestamp = item.created_utc
    }
    if (isPost(item)) {
      item.selftext = ''
    } else {
      comments.push(item)
      if (item.link_author === item.author) {
        item.is_op = true
      }
      if (item.id in missingComments) {
        setMissingCommentMeta(item, missingComments)
      }
      if (! userCommentsByPost[item.link_id]) {
        userCommentsByPost[item.link_id] = []
      }
      userCommentsByPost[item.link_id].push(item)
    }
    if (items.length > 0) {
      const prevItem = items[items.length-1]
      if (! prevItem.stickied) {
        item.prev = prevItem.name
      }
    }
    items.push(item)
  })
  // [...items] would be more clear here than slice() but it gives syntax error for some reason
  items.slice().reverse().forEach((item, index, array) => {
    if (index > 0) {
      item.next = array[index-1].name
    }
  })
  const redditInfoItems = data.info
  Object.values(redditInfoItems).forEach(item => {
    if (itemIsRemovedOrDeleted(item, false)) {
      userPage_item_lookup[item.name].removed = true
    }
    userPage_item_lookup[item.name].collapsed = item.collapsed
  })
  const commentParentsAndPosts_new = data.parents
  Object.assign(commentParentsAndPosts, commentParentsAndPosts_new)
  setPostAndParentDataForComments(comments, commentParentsAndPosts)
  await global.setState({items, num_pages, userNext: userPageData.after,
    commentParentsAndPosts, oldestTimestamp, newestTimestamp
  })
  if (userPageData.after && all) {
    return getItems(user, kind, global, sort, '', userPageData.after, time, limit, all)
  }
  return userPageData.after
}
