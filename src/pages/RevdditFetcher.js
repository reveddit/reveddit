import React from 'react'
import scrollToElement from 'scroll-to-element'
import { getRevdditComments } from 'data_processing/subreddit_comments'
import { getRevdditPosts } from 'data_processing/subreddit_posts'
import { getRevdditThreadPost, getRevdditThreadComments } from 'data_processing/thread'
import { itemIsOneOfSelectedRemovedBy } from 'data_processing/filters'
import Selections from 'pages/common/selections'
import { removedFilter_types } from 'state'
import { REMOVAL_META, NOT_REMOVED, USER_REMOVED } from 'pages/common/RemovedBy'

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
  if (page_type in category_settings) {
    return category_settings[page_type][sub_type]
  }
  return {}
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
  }
  return null

}
const getLoadDataFunctionAndParam = (page_type, subreddit, user, threadID) => {
  switch(page_type) {
    case 'subreddit_posts': {
      return [getRevdditPosts, subreddit]
      break
    }
    case 'subreddit_comments': {
      return [getRevdditComments, subreddit]
      break
    }
    case 'thread': {
      return [getRevdditThreadPost, threadID]
      break
    }
    case 'user': {
      return [getRevdditUserItems, user]
      break
    }
    default: {
      console.error('Unrecognized page type: ['+page_type+']')
    }
  }
  return null
}

export const withFetch = (WrappedComponent) =>
  class extends React.Component {
    state = {
      items: [],
      threadPost: {},
      loading: true
    }
    componentDidMount() {
      let subreddit = (this.props.match.params.subreddit || '').toLowerCase()
      const user = (this.props.match.params.user || '' ).toLowerCase()
      const threadID = this.props.match.params.threadID
      const { userSubreddit } = (this.props.match.params.userSubreddit || '').toLowerCase()
      if (userSubreddit) {
        subreddit = 'u_'+userSubreddit
      }
      const { page_type } = this.props
      const page_title = getPageTitle(page_type, subreddit)
      if (page_title) {
        document.title = page_title
      }
      this.props.global.setStateFromQueryParams(page_type,
                      new URLSearchParams(this.props.location.search))
      .then(result => {
        const [loadDataFunction, param] = getLoadDataFunctionAndParam(page_type, subreddit, user, threadID)
        const firstPromise = loadDataFunction(param, this.props.global)
        const promises = [firstPromise]
        firstPromise
        .then(items => {
          let newState = {items, loading:false}
          if (page_type === 'thread') {
            newState = {threadPost: items[0]}
          }
          this.setState(newState, this.jumpToHash)
        })
        if (page_type === 'thread') {
          const secondPromise = getRevdditThreadComments(threadID, this.props.global)
          promises.push(secondPromise)
          secondPromise
          .then(items => {
            this.setState({items}, this.jumpToHash)
          })
        }
        Promise.all(promises)
        .then(result => {
          this.setState({loading: false})
        })
      })
    }
    setBefore = (before, before_id, n) => {
      this.setState({ items: [], loading: true})
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      const { page_type } = this.props
      this.props.global.upvoteRemovalRateHistory_update(before, before_id, n, this.props)
      .then(result => {
        return getLoadDataFunctionAndParam(page_type)[0](subreddit, this.props.global)
      })
      .then(items => {
        this.setState({items,loading:false}, this.jumpToHash)
      })
    }

    jumpToHash () {
      const hash = this.props.history.location.hash;
      if (hash) {
        scrollToElement(hash, { offset: -10 });
      }
    }
    getViewableItems(items) {
      const subreddit = this.props.match.params.subreddit.toLowerCase()
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
        if (
          (gs.removedFilter === removedFilter_types.all ||
            (gs.removedFilter === removedFilter_types.not_removed &&
              (! item.removed && item.removedby === NOT_REMOVED) ) ||
            (
              gs.removedFilter === removedFilter_types.removed &&
              (item.deleted || item.removed || (item.removedby && item.removedby !== NOT_REMOVED))
            )
          ) &&
          (removedByFilterIsUnset || itemIsOneOfSelectedRemovedBy(item, gs))
        ) {
          visibleItems.push(item)
        }
      })
      return visibleItems
    }

    render () {
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      const { page_type } = this.props
      const { items } = this.state

      const visibleItemsWithoutCategoryFilter = this.getVisibleItemsWithoutCategoryFilter()
      const viewableItems = this.getViewableItems(visibleItemsWithoutCategoryFilter)
      const {category, category_title, category_unique_field} = getCategorySettings(page_type, subreddit)
      const selections =
      <Selections page_type={page_type}
                  visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                  num_showing={viewableItems.length}
                  allItems={items}
                  category_type={category} category_title={category_title}
                  category_unique_field={category_unique_field}
                  setBefore={this.setBefore}/>

      return (
        <React.Fragment>
          <WrappedComponent {...this.props} {...this.state} selections={selections}
            viewableItems={viewableItems}/>
        </React.Fragment>
      )
    }
  }
