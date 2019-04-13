import React from 'react'
import scrollToElement from 'scroll-to-element'
import {
  getRecentCommentsBySubreddit as getPushshiftCommentsBySubreddit,
  getRecentPostsBySubreddit
} from 'api/pushshift'
import { getPosts, getItems } from 'api/reddit'
import { getRemovedPostIDs } from 'api/removeddit'
import { combinePushshiftAndRedditComments, getFullTitles } from 'dataProcessing'
import Selections from 'pages/common/selections'
import { localSort_types, removedFilter_types } from 'state'
import { itemIsRemovedOrDeleted, postIsDeleted, display_post } from 'utils'
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, NOT_REMOVED, USER_REMOVED,
         AUTOMOD_LATENCY_THRESHOLD } from 'pages/common/RemovedBy'

const getCategorySettings = (page_type, subreddit) => {
  let sub_type = subreddit.toLowerCase() === 'all' ? 'all' : 'other'
  const category_settings = {
    'subreddit_comments': {
      'other': {category: 'link_title',
                category_title: 'Post Title',
                category_unique_field: 'link_id'},
      'all':   {category: 'subreddit',
                category_title: 'Subreddit',
                category_unique_field: 'subreddit'}
    },
    'subreddit_posts': {
      'other': {category: 'domain',
                category_title: 'Domain',
                category_unique_field: 'domain'},
      'all':   {category: 'subreddit',
                category_title: 'Subreddit',
                category_unique_field: 'subreddit'}
    }
  }
  return category_settings[page_type][sub_type]
}

const getPageTitle = (page_type, string) => {
  switch(page_type) {
    case 'subreddit_posts': {
      return `/r/${string}`
      break
    }
    case 'subreddit_comments': {
      return `/r/${string}/comments`
      break
    }
    default: {
      console.error('Unrecognized page type: ['+this.props.page_type+']')
    }
  }
  return null

}

export const withFetch = (WrappedComponent) =>
  class extends React.Component {
    state = {
      items: [],
      loading: true
    }
    componentDidMount() {
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      document.title = getPageTitle(this.props.page_type, subreddit)
      this.props.global.setStateFromQueryParams(this.props.page_type,
                      new URLSearchParams(this.props.location.search))
      .then(result => {
        this.getLoadDataFunction()()
      })
    }
    setBefore = (before, before_id, n) => {
      this.setState({ items: [], loading: true})
      this.props.global.upvoteRemovalRateHistory_update(before, before_id, n, this.props)
      .then(result => {
        this.getLoadDataFunction()()
      })
    }
    getLoadDataFunction() {
      switch(this.props.page_type) {
        case 'subreddit_posts': {
          return this.getRevdditPosts
          break
        }
        case 'subreddit_comments': {
          return this.getRevdditComments
          break
        }
        default: {
          console.error('Unrecognized page type: ['+this.props.page_type+']')
        }
      }
      return null
    }
    getRevdditComments = () => {
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      const gs = this.props.global.state

      this.props.global.setLoading('Loading comments from Pushshift...')
      getPushshiftCommentsBySubreddit(subreddit, gs.n, gs.before, gs.before_id)
      .then(pushshiftComments => {
        this.props.global.setLoading('Comparing comments to Reddit API...')
        const fullTitlePromise = getFullTitles(pushshiftComments)
        const combinePromise = combinePushshiftAndRedditComments(pushshiftComments)
        Promise.all([fullTitlePromise, combinePromise])
        .then(values => {
          const show_comments = []
          const full_titles = values[0]
          pushshiftComments.forEach(ps_comment => {
            if (full_titles && ps_comment.link_id in full_titles) {
              if ( ! (full_titles[ps_comment.link_id].whitelist_status == 'promo_adult_nsfw' &&
                       (ps_comment.removed || ps_comment.deleted))) {
                ps_comment.link_title = full_titles[ps_comment.link_id].title
                show_comments.push(ps_comment)
              }
            }
          })
          pushshiftComments = show_comments
          this.props.global.setSuccess()
          this.setState({
            items: pushshiftComments,
            loading: false
          })
        })
      })
      .then(result => {
        this.jumpToHash()
      })
      .catch(this.props.global.setError)
    }
    getRevdditPosts = () => {
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      const gs = this.props.global.state

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
          this.setState({ items: posts, loading: false }, this.jumpToHash)
          this.props.global.setSuccess()
        })
        .catch(this.props.global.setError)
      } else {
        getRecentPostsBySubreddit(subreddit, gs.n, gs.before, gs.before_id)
        .then(posts_pushshift => {
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
            this.setState({ items: posts, loading: false }, this.jumpToHash)
            this.props.global.setSuccess()
          })
        })
      }
    }

    jumpToHash () {
      const hash = this.props.history.location.hash;
      if (hash) {
        scrollToElement(hash, { offset: -10 });
      }
    }
    getViewableItems(items) {
      const { subreddit } = this.props.match.params
      const {category, category_unique_field} = getCategorySettings(this.props.page_type, subreddit)
      let category_state = this.props.global.state['categoryFilter_'+category]
      const showAllCategories = category_state === 'all'
      return items.filter(item => {
        let itemIsOneOfSelectedCategory = false
        if (category_state === item[category_unique_field]) {
          itemIsOneOfSelectedCategory = true
        }
        return (showAllCategories || itemIsOneOfSelectedCategory)
      })
    }



    getVisibleItemsWithoutCategoryFilter() {
      const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
      const visibleItems = []
      const gs = this.props.global.state
      this.state.items.forEach(item => {
        let itemIsOneOfSelectedRemovedBy = false
        if (gs.removedByFilter[USER_REMOVED] && item.deleted) {
          itemIsOneOfSelectedRemovedBy = true
        } else {
          for (let i = 0; i < Object.keys(REMOVAL_META).length; i++) {
            const type = Object.keys(REMOVAL_META)[i]
            if (gs.removedByFilter[type] && item.removedby && item.removedby === type) {
              itemIsOneOfSelectedRemovedBy = true
              break
            }
          }
        }

        if (
          (gs.removedFilter === removedFilter_types.all ||
            (
              gs.removedFilter === removedFilter_types.removed &&
              (item.deleted || item.removed || (item.removedby && item.removedby !== NOT_REMOVED))
            ) ||
            (gs.removedFilter === removedFilter_types.not_removed &&
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
      const { subreddit } = this.props.match.params
      const { page_type } = this.props
      const { items } = this.state

      const visibleItemsWithoutCategoryFilter = this.getVisibleItemsWithoutCategoryFilter()
      const viewableItems = this.getViewableItems(visibleItemsWithoutCategoryFilter)
      const {category, category_title, category_unique_field} = getCategorySettings(page_type, subreddit)
      return (
        <React.Fragment>
          <Selections page_type={page_type}
            visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
            num_showing={viewableItems.length}
            allItems={items}
            category_type={category} category_title={category_title}
            category_unique_field={category_unique_field}
            setBefore={this.setBefore}/>
          <WrappedComponent {...this.props} {...this.state}
            viewableItems={viewableItems}/>
        </React.Fragment>
      )
    }
  }
