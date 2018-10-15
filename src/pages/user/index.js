import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import {
  queryUserPage,
  queryByID as queryRedditByID,
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
import { itemIsRemovedOrDeleted, isComment, isPost } from '../../utils'
import { connect, item_filter } from '../../state'
import Time from '../common/Time'

const OVERVIEW = 'overview', SUBMITTED = 'submitted', BLANK='', COMMENTS='comments'
const NOW = Math.floor((new Date).getTime()/1000)
const acceptable_kinds = [OVERVIEW, COMMENTS, SUBMITTED, BLANK]
const acceptable_sorts = ['new', 'top', 'controversial', 'hot']
const after_this_utc_force_subreddit_query = NOW - 60*10

const allItems = []
var numPages = 0
const searchPage_userPosts = {}
var notYetQueriedSearchPage = true

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
    } else if (s.removal_status === 'not_removed') {
      this.props.global.setItemFilter(item_filter.not_removed)
    }
    if (s.removedby) {
      this.props.global.setRemovedByFilter_viaString(s.removedby)
    }
    if (s.subreddit) {
      this.props.global.setUserSubredditFilter(s.subreddit)
    }
    // quick fix to avoid reloading when hitting back button after visiting /about ..
    if (! allItems.length) {
      this.getItems_wrapper(user, kind, s.sort, s.before, s.after, s.limit, s.loadAll)
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

  getItems (user, kind, sort, before = '', after = '', limit, loadAll = false) {
    return queryUserPage(user, kind, sort, before, after, limit)
    .then(userPageData => {
      numPages += 1
      const userPage_item_lookup = {}
      const ids = []
      userPageData.items.forEach(item => {
        userPage_item_lookup[item.name] = item
        ids.push(item.name)
        if (isPost(item)) {
          item.selftext = ''
        }
        allItems.push(item)
      })

      return queryRedditByID(ids)
      .then(redditInfoItems => {
        redditInfoItems.forEach(item => {
          if (itemIsRemovedOrDeleted(item)) {
            userPage_item_lookup[item.name].removed = true
          }
        })
        this.setState({numItems: allItems.length})
        if (userPageData.after && loadAll) {
          return this.getItems(user, kind, sort, '', userPageData.after, limit, loadAll)
        }
        return userPageData.after
      })
    })
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
              (this.props.global.state.userPageItemFilter === item_filter.not_removed &&
                (! item.removed && item.removedby === NOT_REMOVED) )
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
    let lastTimeLoaded = ''
    const showAllSubreddits = this.props.global.state.userSubredditFilter === 'all'
    let totalPages = 10
    if (! this.props.global.state.userNext) {
      totalPages = numPages
    }

    if (! this.props.global.state.loading) {
      if (! s.after && this.props.global.state.userNext) {
        loadAllLink = <LoadLink next={this.state.next} user={user} sort={s.sort} this={this} kind={kind} limit={100} show={s.show} loadAll={true}/>
      }
    }
    if (this.props.global.state.loading) {
      nextLink = <div className='non-item'><img className='spin' src='/images/spin.gif'/></div>
    } else if (this.props.global.state.userNext) {
      nextLink = <div className='non-item'>
        <LoadLink next={this.state.next} user={user} sort={s.sort} this={this} kind={kind} show={s.show} limit={s.limit} loadAll={false}/></div>
    }
    if (allItems.length) {
      lastTimeLoaded = <React.Fragment>
                         <div className='non-item text'>since <Time created_utc={allItems.slice(-1)[0].created_utc} /></div>
                         <div className='non-item text'>loaded pages {`${numPages}/${totalPages}`}</div>
                       </React.Fragment>
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
        {lastTimeLoaded}
        {nextLink}
      </div>
    )
  }
}

export const getSettings = User.getSettings
export default withRouter(connect(User))
