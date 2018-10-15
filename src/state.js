import React from 'react'
import { Subscribe, Container } from 'unstated'
import { get, put } from './utils'

// Sort types for comments
export const sort = {
  top: 'SORT_TOP',
  bottom: 'SORT_BOTTOM',
  new: 'SORT_NEW',
  old: 'SORT_OLD'
}

// Filter types for comments
export const filter = {
  all: 'SHOW_ALL',
  removedDeleted: 'SHOW_REMOVED_DELETED',
  removed: 'SHOW_REMOVED',
  deleted: 'SHOW_DELETED'
}

// Filter types for items on user pages
export const item_filter = {
  all: 'SHOW_ALL',
  removed: 'SHOW_REMOVED',
  not_removed: 'SHOW_NOT_REMOVED',
}

// Keys for localStorage
const sortKey = 'commentSort'
const filterKey = 'commentFilter'

class GlobalState extends Container {
  state = {
    commentSort: get(sortKey, sort.top),
    commentFilter: get(filterKey, filter.removedDeleted),
    userNext: {},
    userPageItemFilter: item_filter.removed,
    userPageRemovedByFilter: {},
    userSubredditFilter: 'all',
    statusText: '',
    statusImage: undefined,
    loading: false,
    error: false
  }

  setUserSubredditFilter(subreddit) {
    this.setState({userSubredditFilter: subreddit})
  }

  setRemovedByFilter (filterType, isChecked) {
    let userPageRemovedByFilter = this.state.userPageRemovedByFilter
    if (isChecked) {
      userPageRemovedByFilter[filterType] = true
    } else {
      delete userPageRemovedByFilter[filterType]
    }
    this.setState({userPageRemovedByFilter: userPageRemovedByFilter})
  }

  setRemovedByFilter_viaString(removedby_str) {
    const removedby_arr = removedby_str.split(',')
    const removedby_obj = {}
    removedby_arr.forEach(type => {
      if (type.trim()) {
        removedby_obj[type.trim()] = true
      }
    })
    this.setState({userPageRemovedByFilter: removedby_obj})
  }

  removedByFilterIsUnset () {
    return Object.keys(this.state.userPageRemovedByFilter).length === 0
  }

  setItemFilter (filterType) {
    this.setState({userPageItemFilter: filterType})
  }

  setCommentSort (sortType) {
    put(sortKey, sortType)
    this.setState({commentSort: sortType})
  }

  setCommentFilter (filterType) {
    put(filterKey, filterType)
    this.setState({commentFilter: filterType})
  }

  setSuccess = () => {
    if (! this.state.error) {
      this.setState({statusText: '', statusImage: '/images/success.png', loading:false})
    }
  }
  setLoading = (text) => this.setState({statusText: text, statusImage: '/images/loading.gif', loading:true})
  setError = (error) => this.setState({statusText: error.message, statusImage: '/images/error.png', loading:false, error: true})
  clearStatus = () => this.setState({statusText: '', statusImage: undefined, loading:false})
}

// A redux-like connect function for Unstated
export const connect = Component => {
  return props => (
    <Subscribe to={[GlobalState]}>
      {gloablState => <Component {...props} global={gloablState} />}
    </Subscribe>
  )
}
