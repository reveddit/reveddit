import React from 'react'
import { Subscribe, Container } from 'unstated'
import { AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED,
         UNKNOWN_REMOVED, NOT_REMOVED } from 'pages/common/RemovedBy'
import { SimpleURLSearchParams, get, put } from 'utils'

export const getExtraGlobalStateVars = (page_type, sort) => {
  let hasVisitedUserPage = false
  if (get('hasVisitedUserPage', null)) {
    hasVisitedUserPage = true
  } else if (page_type === 'user') {
    hasVisitedUserPage = true
    put('hasVisitedUserPage', true)
  }

  let hasVisitedUserPage_sortTop = false
  if (get('hasVisitedUserPage_sortTop', null)) {
    hasVisitedUserPage_sortTop = true
  } else if (page_type === 'user' && sort === 'top') {
    hasVisitedUserPage_sortTop = true
    put('hasVisitedUserPage_sortTop', true)
  }

  let hasVisitedSubredditPage = false
  if (get('hasVisitedSubredditPage', null)) {
    hasVisitedSubredditPage = true
  } else if (page_type === 'subreddit_posts') {
    hasVisitedSubredditPage = true
    put('hasVisitedSubredditPage', true)
  }
  return {hasVisitedUserPage, hasVisitedUserPage_sortTop, hasVisitedSubredditPage}
}


export const urlParamKeys = {
  removedFilter: 'removal_status', // removedFilter should appear above removedByFilter
  removedByFilter: 'removedby',
  localSort: 'localSort',
  localSortReverse: 'localSortReverse',
  showContext: 'showContext',
  categoryFilter_subreddit: 'subreddit',
  categoryFilter_domain: 'domain',
  categoryFilter_link_title: 'link_title',
  n: 'n',
  before: 'before',
  before_id: 'before_id',
  keywords: 'keywords',
  id: 'id',
  context: 'context',
  frontPage: 'frontPage',
  q: 'q', author: 'author', subreddit: 's_subreddit', after: 'after', domain: 's_domain', or_domain: 's_or_domain',
  content: 'content',
  tagsFilter: 'tags',
  url: 'url',
  selfposts: 'selfposts',
  limitCommentDepth: 'limitCommentDepth'
}

export const removedFilter_types = {
  all: 'all',
  removed: 'removed',
  not_removed: 'not_removed'
}
export const removedFilter_text = {
  all: 'all',
  removed: 'actioned',
  not_removed: 'not actioned',
}
export const localSort_types = {
  score: 'score',
  date: 'date',
  num_comments: 'num_comments',
  controversiality: 'controversiality',
  controversiality1: 'controversiality1',
  controversiality2: 'controversiality2',
  comment_length: 'comment_length',
  num_crossposts: 'num_crossposts',
  num_replies: 'num_replies',
  subreddit_subscribers: 'subreddit_subscribers'
}
// These defaults are for the URL
export const filter_pageType_defaults = {
  removedFilter: {
    user: removedFilter_types.removed,
    thread: removedFilter_types.all,
    subreddit_posts: removedFilter_types.removed,
    subreddit_comments: removedFilter_types.removed,
    domain_posts: removedFilter_types.removed,
    duplicate_posts: removedFilter_types.all
  },
  removedByFilter: '', // this is different than the state initialization value
  tagsFilter: '',
  localSort: {
    user: localSort_types.date,
    thread: localSort_types.score,
    subreddit_posts: localSort_types.date,
    subreddit_comments: localSort_types.date,
    domain_posts: localSort_types.date,
    duplicate_posts: localSort_types.num_comments
  },
  localSortReverse: false,
  showContext: true,
  categoryFilter_subreddit: 'all',
  categoryFilter_domain: 'all',
  categoryFilter_link_title: 'all',
  n: 1000,
  before: '',
  before_id: '',
  keywords: '',
  id: '',
  context: '',
  frontPage: false,
  q: '', author: '', subreddit: '', after: '', domain: '', or_domain: '',
  content: 'all', url: '',
  selfposts: true,
  limitCommentDepth: true
}

const maxN = 60000


const getMultiFilterSettings = (stringValue) => {
  const settings = {}
  stringValue.split(',').forEach(type => {
    if (type.trim()) {
      settings[type.trim()] = true
    }
  })
  return settings
}

const create_qparams = () => new SimpleURLSearchParams(window.location.search)

export const create_qparams_and_adjust = (page_type, selection, value) => {
  const queryParams = create_qparams()
  adjust_qparams_for_selection(page_type, queryParams, selection, value)
  return queryParams
}
const adjust_qparams_for_selection = (page_type, queryParams, selection, value) => {
  if (value === filter_pageType_defaults[selection] ||
      value === filter_pageType_defaults[selection][page_type]) {
    queryParams.delete(urlParamKeys[selection])
  } else {
    queryParams.set(urlParamKeys[selection], value)
  }
  return queryParams
}

class GlobalState extends Container {
  constructor(props) {
     super(props)
     this.state = this.getInitialState()
  }

  getInitialState() {
    return {
        n: 1000,
        before: '',
        before_id: '',
        keywords: '',
        items: [],
        threadPost: {},
        num_pages: 0,
        userNext: null,
        removedFilter: removedFilter_types.all,
        removedByFilter: {},
        tagsFilter: {},
        categoryFilter_subreddit: 'all',
        categoryFilter_domain: 'all',
        categoryFilter_link_title: 'all',
        localSort: localSort_types.date,
        localSortReverse: false,
        showContext: true,
        statusText: '',
        statusImage: undefined,
        loading: false,
        error: false,
        userIssueDescription: '',
        id: '',
        context: '',
        frontPage: false,
        q: '', author: '', subreddit: '', after: '', domain: '', or_domain: '',
        content: 'all', url: '',
        selfposts: true,
        itemsLookup: {},
        commentTree: [],
        initialFocusCommentID: '',
        commentParentsAndPosts: {},
        limitCommentDepth: true,
        moderators: {},
        moderated_subreddits: {},
        authors: {}
      }
  }

  setStateFromCurrentURL = (page_type) => {
    return this.setStateFromQueryParams(page_type, create_qparams())
  }

  setStateFromQueryParams(page_type, queryParams, extraGlobalStateVars = {}, callback = () => {}) {
    if (! page_type) {
      console.error('page_type is undefined')
    }
    if (page_type === 'info' && queryParams.get('url')) {
      page_type = 'duplicate_posts'
    }
    const stateVar = extraGlobalStateVars
    for (const [param, urlParamKey] of Object.entries(urlParamKeys)) {
      const paramValue = queryParams.get(urlParamKey)
      const paramValue_decoded = paramValue === null ? paramValue : decodeURIComponent(paramValue)
      this.setValuesForParam(param, paramValue_decoded, stateVar, page_type)
    }
    return this.setState(stateVar, callback)
  }
  setValuesForParam(param, value, stateVar, page_type) {
    if (value === null) {
      if (param in filter_pageType_defaults) {
        if (typeof(filter_pageType_defaults[param]) !== 'object') {
          stateVar[param] = filter_pageType_defaults[param]
        } else if (page_type in filter_pageType_defaults[param]) {
          stateVar[param] = filter_pageType_defaults[param][page_type]
        }
      }
      /*if (stateVar[param] === undefined) {
        stateVar[param] = this.getInitialState()[param]
      }*/
    } else {
      switch(param) {
        case 'removedFilter': {
          if (value !== removedFilter_types.removed) {
            stateVar.removedByFilter = {}
          }
          stateVar[param] = value
          break
        }
        case 'tagsFilter':
        case 'removedByFilter': {
          stateVar[param] = getMultiFilterSettings(value)
          break
        }
        case 'n': {
          if (value > maxN) {
            stateVar[param] = maxN
          } else {
            stateVar[param] = value
          }
          break
        }
        default: {
          if (value === 'false') {
            value = false
          } else if (value === 'true') {
            value = true
          } else if (/^\d+$/.test(value)) {
            value = parseInt(value)
          }
          stateVar[param] = value
        }
      }
    }
  }
  context_update = (context, page_type, callback = () => {}) => {
    const queryParams = create_qparams_and_adjust(page_type, 'context', context)
    adjust_qparams_for_selection(page_type, queryParams, 'showContext', true)
    return this.setStateFromQueryParams(page_type, queryParams, {}, callback)
  }
  selection_update = (selection, value, page_type, callback = () => {}) => {
    const queryParams = create_qparams_and_adjust(page_type, selection, value)
    return this.updateURLandState(queryParams, page_type, callback)
  }
  updateURLandState = (queryParams, page_type, callback = () => {}) => {
    let to = `${window.location.pathname}${queryParams.toString()}`
    window.history.replaceState(null,null,to)
    return this.setStateFromQueryParams(page_type, queryParams, {}, callback)
  }
  upvoteRemovalRateHistory_update = (before, before_id, n, content_type, queryParams, baseURL) => {
    queryParams.set(urlParamKeys.before, before)
    queryParams.set(urlParamKeys.before_id, before_id)
    queryParams.set(urlParamKeys.n, n)
    queryParams.set(urlParamKeys.removedFilter, removedFilter_types.removed)
    queryParams.set(urlParamKeys.localSort, localSort_types.score)
    queryParams.set(urlParamKeys.removedByFilter, [MOD_OR_AUTOMOD_REMOVED, AUTOMOD_REMOVED, UNKNOWN_REMOVED].join(','))
    window.location.href = `${baseURL}${queryParams.toString()}`
  }
  categoryFilter_update = (type, value, page_type) => {
    this.selection_update('categoryFilter_'+type, value, page_type)
  }
  removedFilter_update = (value, page_type) => {
    const queryParams = create_qparams()
    if (value !== removedFilter_types.removed) {
      queryParams.delete(urlParamKeys.removedByFilter)
    }

    adjust_qparams_for_selection(page_type, queryParams, 'removedFilter', value)
    return this.updateURLandState(queryParams, page_type)
  }
  removedByFilter_update = (target, page_type) => {
    const queryParams = create_qparams()
    const removedby_settings = getMultiFilterSettings(queryParams.get(urlParamKeys.removedByFilter) || '')
    if (target.checked) {
      removedby_settings[target.value] = true
    } else {
      delete removedby_settings[target.value]
    }
    const value = Object.keys(removedby_settings).join()

    adjust_qparams_for_selection(page_type, queryParams, 'removedByFilter', value)
    return this.updateURLandState(queryParams, page_type)
  }
  tagsFilter_update = (target, page_type) => {
    const queryParams = create_qparams()
    const settings = getMultiFilterSettings(queryParams.get(urlParamKeys.tagsFilter) || '')
    if (target.checked) {
      settings[target.value] = true
    } else {
      delete settings[target.value]
    }
    const value = Object.keys(settings).join()

    adjust_qparams_for_selection(page_type, queryParams, 'tagsFilter', value)
    return this.updateURLandState(queryParams, page_type)
  }


  removedByFilterIsUnset () {
    return Object.keys(this.state.removedByFilter).length === 0
  }
  tagsFilterIsUnset () {
    return Object.keys(this.state.tagsFilter).length === 0
  }
  threadFiltersAreUnset() {
    return (this.removedByFilterIsUnset() &&
            this.state.removedFilter === removedFilter_types.all &&
            this.tagsFilterIsUnset()
           )
  }
  resetThreadFilters = (page_type) => {
    const queryParams = create_qparams()
    adjust_qparams_for_selection(page_type, queryParams, 'removedFilter', removedFilter_types.all)
    adjust_qparams_for_selection(page_type, queryParams, 'tagsFilter', '')
    adjust_qparams_for_selection(page_type, queryParams, 'removedByFilter', '')
    return this.updateURLandState(queryParams, page_type)
  }

  setSuccess = (other = {}) => {
    if (! this.state.error) {
      return this.setState({statusText: '', statusImage: '/images/success.png', loading:false, ...other})
    } else if (Object.keys(other).length) {
      return this.setState(other)
    }
  }
  setError = (error, other = {}) => {
    return this.setState({statusText: error.message, statusImage: '/images/error.png', loading:false, error: true, ...other})
  }
  setLoading = (text) => this.setState({statusText: text, statusImage: '/images/loading.gif', loading:true})
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
