import {
  queryUserPage,
  getItems as getRedditItemsByID,
  usernameAvailable,
  userPageHTML,
  getModeratedSubreddits,
  oauth_reddit_rev,
  www_reddit,
} from 'api/reddit'
import { getMissingComments } from 'api/reveddit'
import { getAuth } from 'api/reddit/auth'
import {
  getAutoremovedItems
} from 'api/pushshift'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import { itemIsRemovedOrDeleted, isComment, isPost, SimpleURLSearchParams } from 'utils'
import { setPostAndParentDataForComments } from 'data_processing/info'
import { setMissingCommentMeta } from 'data_processing/missing_comments'

export const getQueryParams = () => {
  const result = {
                  sort: 'new', before: '', after: '', limit: 100,
                  loadAll: false, searchPage_after: '', show:''}
  const queryParams = new SimpleURLSearchParams(window.location.search);

  if (queryParams.has('all')) { result.loadAll = true }

  ['sort', 'before', 'after', 'limit', 'searchPage_after', 'show', 't'].forEach(p => {
    if (queryParams.has(p)) {
      result[p] = queryParams.get(p)
    }
  })

  return result
}

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

export const getRevdditUserItems = async (user, kind, qp, global) => {
  const gs = global.state
  // only request missing comments once. this will always resolve immediately
  await missing_comments_promise.then(({comments}) => {
    if (Object.keys(comments).length === 0) {
      missing_comments_promise = getMissingComments({limit: 200})
      .catch(() => {
        return blankMissingComments
      })
    }
  })
  getModeratedSubreddits(user).then(moderated_subreddits => global.setState({moderated_subreddits}))
  return getItems(user, kind, global, qp.sort, qp.before, qp.after || gs.userNext, qp.t, qp.limit, qp.loadAll)
  .then(result => {
    return lookupAndSetRemovedBy(global)
    .then( tempres => {
      global.setSuccess()
      return result
    })
  })
}

function getItems (user, kind, global, sort, before = '', after = '', time, limit, loadAll = false) {
  const gs = global.state
  const {commentParentsAndPosts} = gs
  return queryUserPage(user, kind, sort, before, after, time, limit, oauth_reddit_rev)
  .then(async (userPageData) => {
    if ('error' in userPageData) {
      if (userPageData.error == 404) {
        return usernameAvailable(user)
        .then(result => {
          if (result === true) {
            global.setError(Error(''), {userIssueDescription: 'does not exist'})
          } else {
            return userPageHTML(user)
            .then(html_result => {
              const status = `You can also check account status at <a href="${www_reddit}/user/${user}">/u/${user}</a> or <a href="${www_reddit}/r/ShadowBan">/r/ShadowBan</a>.`
              if ('error' in html_result) {
                console.error(html_result.error)
                global.setError(Error(''), {userIssueDescription: deleted_shadowbanned_notexist+verify+status})
              } else if (html_result.html.match(/has deleted their account/)) {
                global.setError(Error(''), {userIssueDescription: 'has deleted their account'})
              } else if (html_result.html.match(/must be 18/)) {
                global.setError(Error(''), {userIssueDescription: deleted_shadowbanned_notexist+verify+status})
              } else {
                global.setError(Error(''), {userIssueDescription: 'may be shadowbanned or may not exist. '+verify+status})
              }
              return null
            })
          }
        })
      } else if ('message' in userPageData && userPageData.message.toLowerCase() == 'forbidden') {
        global.setError(Error(''), {userIssueDescription: 'suspended'})
      }
    }
    const {comments: missingComments} = await missing_comments_promise
    const num_pages = gs.num_pages+1
    const userPage_item_lookup = {}
    const ids = [], comment_parent_and_post_ids = {}, comments = []
    const items = gs.items
    userPageData.items.forEach(item => {
      userPage_item_lookup[item.name] = item
      ids.push(item.name)
      if (isPost(item)) {
        item.selftext = ''
      } else {
        comments.push(item)
        if (! commentParentsAndPosts[item.link_id]) {
          comment_parent_and_post_ids[item.link_id] = true
        }
        if (! commentParentsAndPosts[item.parent_id]) {
          comment_parent_and_post_ids[item.parent_id] = true
        }
        if (item.link_author === item.author) {
          item.is_op = true
        }
        if (item.id in missingComments) {
          setMissingCommentMeta(item, missingComments)
        }
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
    return getAuth()
    .then(auth => {
      const params = ['name', auth, oauth_reddit_rev]
      const comment_parent_and_post_promise = getRedditItemsByID(
        Object.keys(comment_parent_and_post_ids), ...params)
      return getRedditItemsByID(ids, ...params)
      .then(redditInfoItems => {
        Object.values(redditInfoItems).forEach(item => {
          if (itemIsRemovedOrDeleted(item, false)) {
            userPage_item_lookup[item.name].removed = true
          }
          userPage_item_lookup[item.name].collapsed = item.collapsed
        })
        return comment_parent_and_post_promise.then(commentParentsAndPosts_new => {
          Object.assign(commentParentsAndPosts, commentParentsAndPosts_new)
          setPostAndParentDataForComments(comments, commentParentsAndPosts)
          return global.setState({items, num_pages, userNext: userPageData.after, commentParentsAndPosts})
          .then(() => {
            if (userPageData.after && loadAll) {
              return getItems(user, kind, global, sort, '', userPageData.after, time, limit, loadAll)
            }
            return userPageData.after
          })
        })
      })
    })
  })
}
