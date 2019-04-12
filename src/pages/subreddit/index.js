import React from 'react'
import { Link } from 'react-router-dom'
import scrollToElement from 'scroll-to-element'
import { getRemovedPostIDs } from 'api/removeddit'
import { getRecentPostsBySubreddit } from 'api/pushshift'
import { getPosts, getItems } from 'api/reddit'
import Post from 'pages/common/Post'
import {connect, removedFilter_types, localSort_types} from 'state'
import { itemIsRemovedOrDeleted, postIsDeleted, display_post } from 'utils'
import Time from 'pages/common/Time'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED, USER_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'
import Selections from 'pages/common/selections'

const byScore = (a, b) => {
  return (b.score - a.score) || (b.num_comments - a.num_comments)
}
const byDate = (a, b) => {
  return (b.created_utc - a.created_utc) || (b.num_comments - a.num_comments)
}
const byNumComments = (a, b) => {
  return (b.num_comments - a.num_comments) || (b.created_utc - a.created_utc)
}
const byControversiality = (a, b) => {
  return (a.score - b.score) || (b.num_comments - a.num_comments)
}
const defaultN = 1000

class Subreddit extends React.Component {
  state = {
    posts: [],
    loading: true,
    n: defaultN
  }

  componentDidMount () {
    const { subreddit = 'all' } = this.props.match.params
    this.props.global.setStateFromQueryParams(this.props.page_type,
                    new URLSearchParams(this.props.location.search))
    .then(result => {
      this.getRemovedPosts()
    })
  }

  // Check if the subreddit has changed in the url, and fetch posts accordingly
  componentDidUpdate (prevProps) {
    const { subreddit: newSubreddit = 'all' } = this.props.match.params
    const { subreddit = 'all' } = prevProps.match.params

    if (subreddit !== newSubreddit) {
      this.getRemovedPosts()
    }
  }
  jumpToHash () {
    const hash = this.props.history.location.hash;
    if (hash) {
      scrollToElement(hash, { offset: -10 });
    }
  }
  setBefore = (before, before_id, n) => {
    this.setState({pushshiftComments: []})
    this.props.global.upvoteRemovalRateHistory_update(before, before_id, n, this.props)
    .then(result => {
      this.getRemovedPosts()
    })
  }

  // Download post IDs from removeddit API, then post info from reddit API
  getRemovedPosts () {
    let { subreddit = 'all' } = this.props.match.params
    subreddit = subreddit.toLowerCase()
    document.title = `/r/${subreddit}`
    const n = this.state.n
    this.setState({ posts: [], loading: true, n: n })

    const queryParams = new URLSearchParams(this.props.location.search)
    const paramValueBefore = queryParams.get('before')
    let before = ''
    if (paramValueBefore) {
      before = paramValueBefore
    }
    const paramValueBeforeID = queryParams.get('before_id')
    let before_id = ''
    if (paramValueBeforeID) {
      before_id = paramValueBeforeID
    }

    this.props.global.setLoading('Loading removed posts...')
    if (subreddit === 'all') {
      getRemovedPostIDs(subreddit)
      .then(postIDs => getPosts(postIDs))
      .then(posts => {
        posts.forEach(post => {
          post.selftext = ''
          if (postIsDeleted(post)) {
            post.deleted = true
          } else {
            post.removed = true
          }
        })
        this.setState({ posts, loading: false }, this.jumpToHash)
        this.props.global.setSuccess()
      })
      .catch(this.props.global.setError)
    } else {
      getRecentPostsBySubreddit(subreddit, n, before, before_id)
      .then(posts_pushshift => {
        if (posts_pushshift.length < this.state.n) {
          this.setState({n: posts_pushshift.length})
        }
        const ids = []
        const posts_pushshift_lookup = {}
        posts_pushshift.forEach(post => {
          ids.push(post.name)
          posts_pushshift_lookup[post.id] = post
        })

        getItems(ids)
        .then(posts_reddit => {
          const show_posts = []
          posts_reddit.forEach(post => {
            post.selftext = ''
            const ps_item = posts_pushshift_lookup[post.id]
            const retrievalLatency = ps_item.retrieved_on-ps_item.created_utc
            if (itemIsRemovedOrDeleted(post)) {
              if (postIsDeleted(post)) {
                if (post.num_comments > 0) {
                  post.deleted = true
                  display_post(show_posts, post)
                } else {
                  // not showing deleted posts with 0 comments
                }
              } else {
                post.removed = true
                if (! ps_item.is_crosspostable) {
                  if (retrievalLatency <= AUTOMOD_LATENCY_THRESHOLD) {
                    post.removedby = AUTOMOD_REMOVED
                  } else {
                    post.removedby = UNKNOWN_REMOVED
                  }
                } else {
                  post.removedby = MOD_OR_AUTOMOD_REMOVED
                }
                display_post(show_posts, post)
              }
            } else {
              // not-removed posts
              if ('is_crosspostable' in ps_item && ! ps_item.is_crosspostable) {
                post.removedby = AUTOMOD_REMOVED_MOD_APPROVED
                //show_posts.push(post)
              } else {
                post.removedby = NOT_REMOVED
              }
              show_posts.push(post)
            }
          })

          return show_posts
        })
        .then(posts => {
          this.setState({ posts: posts, loading: false }, this.jumpToHash)
          this.props.global.setSuccess()
        })
      })
    }
  }

  getVisibleItemsWithoutCategoryFilter() {
    const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
    const visibleItems = []
    this.state.posts.forEach(item => {
      let itemIsOneOfSelectedRemovedBy = false
      if (this.props.global.state.removedByFilter[USER_REMOVED] && item.deleted) {
        itemIsOneOfSelectedRemovedBy = true
      } else {
        for (let i = 0; i < Object.keys(REMOVAL_META).length; i++) {
          const type = Object.keys(REMOVAL_META)[i]
          if (this.props.global.state.removedByFilter[type] && item.removedby && item.removedby === type) {
            itemIsOneOfSelectedRemovedBy = true
            break
          }
        }
      }

      if (
        (this.props.global.state.removedFilter === removedFilter_types.all ||
          (
            this.props.global.state.removedFilter === removedFilter_types.removed &&
            (item.deleted || item.removed || (item.removedby && item.removedby !== NOT_REMOVED))
          ) ||
          (this.props.global.state.removedFilter === removedFilter_types.not_removed &&
            (! item.removed && item.removedby === NOT_REMOVED) )
        ) &&
        (removedByFilterIsUnset || itemIsOneOfSelectedRemovedBy)
      ) {
        visibleItems.push(item)
      }
    })
    return visibleItems
  }

  render () {
    const { subreddit = 'all' } = this.props.match.params
    const localSort = this.props.global.state.localSort
    const noPostsFound = this.state.posts.length === 0 && !this.state.loading
    let category = 'domain'
    let category_title = 'Domain'
    let category_unique_field = 'domain'
    if (subreddit.toLowerCase() === 'all') {
      category = 'subreddit'
      category_title = 'Subreddit'
    }
    let category_state = this.props.global.state['categoryFilter_'+category]
    const showAllCategories = category_state === 'all'

    const visibleItems = this.getVisibleItemsWithoutCategoryFilter()

    const posts_sorted = visibleItems
    if (localSort === localSort_types.date) {
      posts_sorted.sort( byDate )
    } else if (localSort === localSort_types.num_comments) {
      posts_sorted.sort( byNumComments )
    } else if (localSort === localSort_types.score) {
      posts_sorted.sort( byScore )
    } else if (localSort === localSort_types.controversiality) {
      posts_sorted.sort( byControversiality )
    }
    if (this.props.global.state.localSortReverse) {
      posts_sorted.reverse()
    }

    return (
      <React.Fragment>
        <Selections page_type='subreddit_posts' visibleItems={visibleItems}
            allItems={this.state.posts}
            category_type={category} category_title={category_title}
            category_unique_field={category_unique_field}
            setBefore={this.setBefore}/>
        {
          noPostsFound ?
            <p>No removed posts found for /r/{subreddit}</p>
            :
            visibleItems.map(post => {
              let itemIsOneOfSelectedCategories = false
              if (category_state === post[category]) {
                itemIsOneOfSelectedCategories = true
              }
              if (showAllCategories || itemIsOneOfSelectedCategories) {
                return <Post key={post.id} {...post} />
              }
            })
        }
      </React.Fragment>
    )
  }
}

export default connect(Subreddit)
