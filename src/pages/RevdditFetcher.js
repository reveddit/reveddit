import React from 'react'
import scrollToElement from 'scroll-to-element'
import { getRevdditComments } from 'data_processing/subreddit_comments'
import { getRevdditPosts } from 'data_processing/subreddit_posts'
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
const getLoadDataFunction = (page_type) => {
  switch(page_type) {
    case 'subreddit_posts': {
      return getRevdditPosts
      break
    }
    case 'subreddit_comments': {
      return getRevdditComments
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
      loading: true
    }
    componentDidMount() {
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      const { page_type } = this.props

      document.title = getPageTitle(page_type, subreddit)
      this.props.global.setStateFromQueryParams(page_type,
                      new URLSearchParams(this.props.location.search))
      .then(result => {
        return getLoadDataFunction(page_type)(subreddit, this.props.global)
      })
      .then(items => {
        this.setState({items,loading:false}, this.jumpToHash)
      })
    }
    setBefore = (before, before_id, n) => {
      this.setState({ items: [], loading: true})
      const subreddit = this.props.match.params.subreddit.toLowerCase()
      const { page_type } = this.props
      this.props.global.upvoteRemovalRateHistory_update(before, before_id, n, this.props)
      .then(result => {
        return getLoadDataFunction(page_type)(subreddit, this.props.global)
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
      const subreddit = this.props.match.params.subreddit.toLowerCase()
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
