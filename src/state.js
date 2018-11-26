import React from 'react'
import { Subscribe, Container } from 'unstated'

export const removedFilter_types = {
  all: 'all',
  removed: 'removed',
  not_removed: 'not_removed',
  user_default: 'removed',
  thread_default: 'all',
  subreddit_posts_default: 'removed',
  subreddit_comments_default: 'removed'
}
export const removedFilter_text = {
  all: '',
  removed: 'removed',
  not_removed: 'not removed',
}

export const localSort_types = {
  score: 'score',
  date: 'date',
  num_comments: 'num_comments',
  controversiality: 'controversiality',
  controversiality1: 'controversiality1',
  controversiality2: 'controversiality2',
  user_default: 'date',
  thread_default: 'score',
  subreddit_posts_default: 'date',
  subreddit_comments_default: 'date'
}

export const localSortReverseDefault = false


class GlobalState extends Container {
  state = {
    userNext: {},
    selection_defaults: {},
    removedFilter: removedFilter_types.all,
    removedByFilter: {},
    subredditFilter: 'all',
    localSort: localSort_types.default,
    localSortReverse: localSortReverseDefault,
    statusText: '',
    statusImage: undefined,
    loading: false,
    error: false
  }


  setLocalSort(value) {
    if (Object.values(localSort_types).includes(value)) {
      this.setState({localSort: value})
    }
  }
  setLocalSortAndDefault(value, defaultValue) {
    let selection_defaults = this.state.selection_defaults
    selection_defaults.localSort = defaultValue
    this.setState({localSort: value,
                   selection_defaults: selection_defaults})
  }

  setLocalSortReverse(value) {
    this.setState({localSortReverse: value})
  }

  setSubredditFilter(subreddit) {
    this.setState({subredditFilter: subreddit})
  }

  setRemovedByFilter (filterType, isChecked) {
    let removedByFilter = this.state.removedByFilter
    if (isChecked) {
      removedByFilter[filterType] = true
    } else {
      delete removedByFilter[filterType]
    }
    this.setState({removedByFilter: removedByFilter})
  }

  setRemovedByFilter_viaString(removedby_str) {
    const removedby_arr = removedby_str.split(',')
    const removedby_obj = {}
    removedby_arr.forEach(type => {
      if (type.trim()) {
        removedby_obj[type.trim()] = true
      }
    })
    this.setState({removedByFilter: removedby_obj})
  }

  removedByFilterIsUnset () {
    return Object.keys(this.state.removedByFilter).length === 0
  }
  removedFiltersAreUnset() {
    return (this.removedByFilterIsUnset() &&
            this.state.removedFilter === removedFilter_types.all)
  }
  resetRemovedFilters = () => {
    this.setState({
        removedFilter: this.state.selection_defaults.removedFilter,
      removedByFilter: {}
    })
  }

  setRemovedFilter (value) {
    this.setState({removedFilter: value})
  }
  setRemovedFilterAndDefault (value, defaultValue) {
    let selection_defaults = this.state.selection_defaults
    selection_defaults.removedFilter = defaultValue
    this.setState({removedFilter: value,
                   selection_defaults: selection_defaults})
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
      {globalState => <Component {...props} global={globalState} />}
    </Subscribe>
  )
}
