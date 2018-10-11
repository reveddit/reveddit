import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import {
  queryUserPage,
  queryByID as queryRedditByID,
  querySearchPageByUser,
  querySubredditPageUntil
} from '../../api/reddit'
import Post from '../common/Post'
import Comment from './Comment'
import LoadLink from './LoadLink'
import Selections from './Selections'
import {
  getPost as getRemovedPost,
  getComments as getPushshiftComments,
  getAutoremovedItems
} from '../../api/pushshift'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED } from '../common/RemovedBy'
import scrollToElement from 'scroll-to-element'
import { isRemovedComment, isRemovedSelfPost, isComment, isPost } from '../../utils'
import { connect, item_filter } from '../../state'

const OVERVIEW = 'overview', SUBMITTED = 'submitted', BLANK='', COMMENTS='comments'
const NOW = Math.floor((new Date).getTime()/1000)
const acceptable_kinds = [OVERVIEW, COMMENTS, SUBMITTED, BLANK]
const acceptable_sorts = ['new', 'top', 'controversial', 'hot']
const after_this_utc_force_subreddit_query = NOW - 60*10

const allItems = []
const searchPage_userPosts = {}

class User extends React.Component {
  state = {
    numItems: 0,
    next: {},
    comments_removed_meta: {},
    posts_removed_meta: {}
  }

  static getSettings() {
    const result = {sort: 'new', before: '', after: '', limit: 100, loadAll: false, searchPage_after: '', show:'',
                    filter:'', removedby:'', subreddit:''}
    const url = new URL(window.location.href);
    const queryParams = new URLSearchParams(url.search);

    if (queryParams.has('all')) { result.loadAll = true }

    ['sort', 'before', 'after', 'limit', 'searchPage_after', 'show', 'removal_status', 'removedby', 'subreddit'].forEach(p => {
      if (queryParams.has(p)) {
        result[p] = queryParams.get(p)
      }
    })

    return result
  }

  componentDidMount () {
    const { user, kind = '' } = this.props.match.params
    const s = User.getSettings()

    if (! acceptable_kinds.includes(kind)) {
      this.props.global.setError(Error('Invalid page, check url'))
      return
    }
    if (! acceptable_sorts.includes(s.sort)) {
      this.props.global.setError(Error('Invalid sort type, check url'))
      return
    }
    if (s.removal_status === 'all') {
      this.props.global.setItemFilter(item_filter.all)
    } else if (s.removal_status === 'unknown') {
      this.props.global.setItemFilter(item_filter.unknown)
    }
    if (s.removedby) {
      this.props.global.setRemovedByFilter_viaString(s.removedby)
    }
    if (s.subreddit) {
      this.props.global.setUserSubredditFilter(s.subreddit)
    }
    // quick fix to avoid reloading when hitting back button after visiting /about .. 
    if (! allItems.length) {
      this.getItems_wrapper(user, kind, s.sort, s.before, s.after, s.limit, s.loadAll, s.searchPage_after)
    }
  }
  jumpToHash () {
    const hash = this.props.history.location.hash;
    if (hash) {
      scrollToElement(hash, { offset: -10 });
    }
  }
  lookupAndSetRemovedBy() {
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
    allItems.forEach(item => {
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
        const removed_meta = this.setRemovedBy(comments_removedBy_undefined, ps_comments_autoremoved)
        this.setState({comments_removed_meta: removed_meta})
      })
      .catch(this.props.global.setError)
    }
    let posts_promise = Promise.resolve()
    if (posts_removedBy_undefined.length) {
        posts_promise = getAutoremovedItems(post_names).then(ps_posts_autoremoved => {
        const removed_meta = this.setRemovedBy(posts_removedBy_undefined, ps_posts_autoremoved)
        this.setState({posts_removed_meta: removed_meta})
      })
      .catch(this.props.global.setError)
    }

    return Promise.all([comments_promise, posts_promise])
  }

  // this can handle posts or comments but not both together
  // should change ps_autoremoved_map key if want to do both at same time
  // - the fix: check for existence of a field that's always existed in one
  //      but not the other, e.g. link_id is in all PS comments and not in submissions
  setRemovedBy(items_removedBy_undefined, ps_items_autoremoved) {
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
          if (retrievalLatency <= 5) {
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

  getItems_wrapper (...args) {
    this.props.global.setLoading('Loading data...')
    return this.getItems(...args)
    .then(result => {
      this.jumpToHash()
      return this.lookupAndSetRemovedBy()
      .then( tempres => {
        this.props.global.setSuccess()
        return result
      })
    })
    .then(result => {
      this.props.global.setState({ userNext: result })
      return result
    })
  }

  getItems (user, kind, sort, before = '', after = '', limit, loadAll = false, searchPage_after = '') {
    let searchPage_promise = Promise.resolve()
    let promises = []
    return queryUserPage(user, kind, sort, before, after, limit)
    .then(userPageData => {
      const userPage_userPosts = []
      const userPage_comments = []
      userPageData.items.forEach(item => {
        if (item.name.slice(0,2) === 't3') {
          userPage_userPosts.push(item)
        } else if (item.name.slice(0,2) === 't1') {
          userPage_comments.push(item)
        }
        if (allItems.length > 0) {
          item.prev = allItems[allItems.length-1].name
        }
        allItems.push(item)
      })
      allItems.slice().reverse().forEach((item, index, array) => {
        if (index > 0) {
          item.next = array[index-1].name
        }
      })
      if (userPage_userPosts.length) {
        const result = this.processPosts(user, sort, after, searchPage_after, userPage_userPosts)
        promises = result.promises
        searchPage_promise = result.searchPage_promise
      }
      if (userPage_comments.length) {
        const comments_promise = this.processComments(userPage_comments)
        promises.push(comments_promise)
      }
      return userPageData.after
    }).then(userPageData_after => {
      return Promise.all(promises).then( values => {
        return Promise.resolve(searchPage_promise).then(searchPage_promise_result => {
          //console.log('searchPage_userPosts length: '+Object.keys(searchPage_userPosts).length)
          let searchPage_after = null
          const last_value = values.slice(-1)[0]
          if (searchPage_promise_result && searchPage_promise_result.searchPage_after) {
            searchPage_after = searchPage_promise_result.searchPage_after
          }
          if (userPageData_after && loadAll) {
            return this.getItems(user, kind, sort, '', userPageData_after, limit, loadAll, searchPage_after)
          }
          return {  userPage_after: userPageData_after,
                  searchPage_after: searchPage_after}
        })
      })
    })
  }

  processComments(comments) {
    const ids = comments.map(c => c.name)
    return queryRedditByID(ids)
    .then(redditInfoComments => {
      const redditUserCommentLookup = {}
      comments.forEach(comment => {
        redditUserCommentLookup[comment.name] = comment
      })
      redditInfoComments.forEach(infoComment => {
        const userComment = redditUserCommentLookup[infoComment.name]
        if (isRemovedComment(infoComment)) {
          userComment.removed = true
        }
      })
      this.setState({numItems: allItems.length})
    })
    .catch(this.props.global.setError)
  }

  processPosts (user, sort, after, searchPage_after, userPage_userPosts) {
    let searchPage_promise = Promise.resolve()
    let promises = []
    const userPage_userPosts_groupedBy_subreddit__recent = {}
    const userPage_userPosts__old = []
    userPage_userPosts.forEach(post => {
      // scan r/subreddit page for recent items to determine removed or not
      // this is necessary since reddit's /search may not return recent items (< 3 mins)
      if (post.created_utc >= after_this_utc_force_subreddit_query) {
        if (! (post.subreddit in userPage_userPosts_groupedBy_subreddit__recent)) {
          userPage_userPosts_groupedBy_subreddit__recent[post.subreddit] = {posts: []}
        }
        userPage_userPosts_groupedBy_subreddit__recent[post.subreddit].posts.push(post)
        userPage_userPosts_groupedBy_subreddit__recent[post.subreddit].oldest_created_utc = post.created_utc
      } else {
        userPage_userPosts__old.push(post)
      }
    })
    Object.keys(userPage_userPosts_groupedBy_subreddit__recent).forEach(
    sub => {
      const sub_data = userPage_userPosts_groupedBy_subreddit__recent[sub]
      const promise = querySubredditPageUntil(sub, sub_data.oldest_created_utc)
      .then(posts => {
        const subreddit_recentPosts = {}
        posts.forEach(
        post => {
          subreddit_recentPosts[post.name] = post
        })
        sub_data.posts.forEach(
        post => {
          if (subreddit_recentPosts[post.name] === undefined || isRemovedSelfPost(post)) {
            post.removed = true
          } else {
            post.removed = false
          }
          post.selftext = ''
        })

        this.setState({ numItems: allItems.length })
      })
      promises.push(promise)
    })
    if ( (! after && ! searchPage_after) ||
         (  after &&   searchPage_after) ) {
      searchPage_promise = querySearchPageByUser(user, sort, searchPage_after)
      .then(searchPageData => {
        let searchPage_last_created_utc = 99999999999
        searchPageData.posts.forEach(
        post => {
          searchPage_userPosts[post.name] = true
          if (post.created_utc < searchPage_last_created_utc) {
            searchPage_last_created_utc = post.created_utc
          }
        })
        return { searchPage_after: searchPageData.after,
                 searchPage_last_created_utc: searchPage_last_created_utc}
      })
      promises.push(searchPage_promise)
    }
    const another_promise = Promise.resolve(searchPage_promise)
    .then(result => {
      userPage_userPosts__old.forEach(
      post => {
        if (isRemovedSelfPost(post)) {
          post.removed = true
        } else if (searchPage_userPosts[post.name] === undefined) {
          if (Object.keys(searchPage_userPosts).length < 100) {
            // • ~80% sure this condition is correct
            // • i'm assuming if /search query of author:xyz returns < 100 posts,
            //   then xyz has not posted more than 100 posts
            // • /search has a limit of how many posts are returned, and it
            //   seems to be around 230 or 240. it is not 1,000
            post.removed = true
          } else if (result && post.created_utc > result.searchPage_last_created_utc) {
            post.removed = true
          } else if (! post.is_self) {
            post.unknown = true
          }
        } else {
          post.removed = false
        }
        post.selftext = ''
      })
      this.setState({ numItems: allItems.length })
    })
    promises.push(another_promise)
    return {promises: promises, searchPage_promise: searchPage_promise}
  }

  getVisibleItemsWithoutSubredditFilter() {
    const s = User.getSettings()
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
    const visibleItems = []
    allItems.forEach(item =>  {
      let itemIsOneOfSelectedRemovedBy = false
      Object.keys(REMOVAL_META).forEach(type => {
        if (this.props.global.state.userPageRemovedByFilter[type] && item.removedby && item.removedby === type) {
          itemIsOneOfSelectedRemovedBy = true
        }
      })
      if (! s.show || s.show === item.name) {
        if ( (s.show === item.name ||
              this.props.global.state.userPageItemFilter === item_filter.all ||
              (
                this.props.global.state.userPageItemFilter === item_filter.removed &&
                (item.removed || (item.removedby && item.removedby !== NOT_REMOVED))
              ) ||
              (this.props.global.state.userPageItemFilter === item_filter.unknown && item.unknown)
             ) &&
             (removedByFilterIsUnset || itemIsOneOfSelectedRemovedBy)) {
          visibleItems.push(item)
        }
      }
    })
    return visibleItems
  }

  render () {
    const { user, kind = ''} = this.props.match.params
    const s = User.getSettings()
    const visibleItems = this.getVisibleItemsWithoutSubredditFilter()
    let loadAllLink = ''
    let nextLink = ''
    const showAllSubreddits = this.props.global.state.userSubredditFilter === 'all'

    if (! this.props.global.state.loading) {
      if (! s.after && this.props.global.state.userNext.userPage_after) {
        loadAllLink = <LoadLink next={this.state.next} user={user} sort={s.sort} this={this} kind={kind} limit={100} show={s.show} loadAll={true}/>
      }
    }
    if (this.props.global.state.loading) {
      nextLink = <div className='next-parent'><img className='spin' src='/images/spin.gif'/></div>
    } else if (this.props.global.state.userNext.userPage_after) {
      nextLink = <div className='next-parent'>
        <LoadLink next={this.state.next} user={user} sort={s.sort} this={this} kind={kind} show={s.show} limit={s.limit} loadAll={false}/></div>
    }

    return (
      <div className='userpage'>
        <div className='subreddit-box'>
        {loadAllLink}
        </div>
        <Selections visibleItems={visibleItems} allItems={allItems}/>
        {
          visibleItems.map(item => {
            let itemIsOneOfSelectedSubreddits = false
            if (this.props.global.state.userSubredditFilter === item.subreddit) {
              itemIsOneOfSelectedSubreddits = true
            }
            if (showAllSubreddits || itemIsOneOfSelectedSubreddits) {
              if (item.name.slice(0,2) === 't3') {
                return <Post key={item.name} {...item} />
              } else {
                return <Comment key={item.name} {...item} sort={s.sort}/>
              }
            }
          })
        }
        {nextLink}
      </div>
    )
  }
}

export const getSettings = User.getSettings
export default withRouter(connect(User))
