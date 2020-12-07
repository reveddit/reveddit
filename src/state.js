import React from 'react'
import { Subscribe, Container } from 'unstated'
import { SimpleURLSearchParams, get, put, ifNumParseInt } from 'utils'
import { limitCommentDepth_global } from 'pages/modals/Settings'
import { agg_defaults_for_page } from 'api/reveddit'

const defaultFilters_str = 'defaultFilters'

export const hasClickedRemovedUserCommentContext = () => {
  put('hasClickedRemovedUserCommentContext', true)
}

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

  let hasClickedRemovedUserCommentContext = false
  if (get('hasClickedRemovedUserCommentContext', null)) {
    hasClickedRemovedUserCommentContext = true
  }
  return {hasVisitedUserPage, hasVisitedUserPage_sortTop,
          hasVisitedSubredditPage, hasClickedRemovedUserCommentContext,
          ...loadingVars}
}

const loadingVars = {statusText: '', statusImage: '/images/loading.gif', loading:true}

const urlParamKeys_max_min_base = {
  num_subscribers: 'num_subscribers',
  score: 'score',
  num_comments: 'num_comments',
  age: 'age',
  link_age: 'link_age',
  link_score: 'link_score',
}
const MIN = '_min', MAX = '_max'
const urlParamKeys_max_min = Object.keys(urlParamKeys_max_min_base)
  .reduce((map,key) => {
    map[key+MIN] = key+MIN
    map[key+MAX] = key+MAX
    return map
  }, {})

const urlParamKeys_max_min_defaults = Object.keys(urlParamKeys_max_min).reduce((m, k) => (m[k] = '', m), {})

//everything except removedFilter can use the default value when resetting to show all items
const urlParamKeys_filters_for_reset_to_show_all_items = {
  removedByFilter: 'removedby',
  categoryFilter_subreddit: 'subreddit',
  categoryFilter_domain: 'domain',
  categoryFilter_link_title: 'link_title',
  keywords: 'keywords',
  post_flair: 'post_flair',
  user_flair: 'user_flair',
  filter_url: 'filter_url',
  tagsFilter: 'tags',
  ...urlParamKeys_max_min,
}

export const urlParamKeys = {
  removedFilter: 'removal_status', // removedFilter should appear above removedByFilter
  localSort: 'localSort',
  localSortReverse: 'localSortReverse',
  showContext: 'showContext',
  before: 'before',
  before_id: 'before_id',
  id: 'id',
  context: 'context',
  frontPage: 'frontPage',
  n: 'n',
  q: 'q', author: 'author', subreddit: 's_subreddit', after: 'after', domain: 's_domain', or_domain: 's_or_domain',
  title: 'title', selftext: 'selftext',
  content: 'content',
  url: 'url',
  selfposts: 'selfposts',
  limitCommentDepth: 'limitCommentDepth',
  page: 'page',
  add_user: 'add_user',
  user_sort: 'user_sort', // for legacy add_user code
  user_kind: 'user_kind', // for legacy add_user code
  user_time: 'user_time', // for legacy add_user code
  t: 't', sort: 'sort', limit: 'limit', show: 'show', all:'all', stickied: 'stickied', distinguished: 'distinguished',
  ...urlParamKeys_filters_for_reset_to_show_all_items
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
  subreddit_subscribers: 'subreddit_subscribers',
  date_observed: 'date_observed',
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
    duplicate_posts: localSort_types.num_comments,
    missing_comments: localSort_types.date,
  },
  localSortReverse: false,
  showContext: true,
  categoryFilter_subreddit: 'all',
  categoryFilter_domain: 'all',
  categoryFilter_link_title: 'all',
  n: {
    domain_posts: 200,
    aggregations: agg_defaults_for_page.limit,
  },
  sort: {
    aggregations: agg_defaults_for_page.sort,
  },
  content: {
    aggregations: agg_defaults_for_page.type,
  },
  before: '',
  before_id: '',
  keywords: '',
  post_flair: '', user_flair: '', filter_url: '',
  id: '',
  context: '',
  frontPage: false,
  q: '', author: '', subreddit: '', after: '', domain: '', or_domain: '', title: '', selftext: '',
  url: '',
  selfposts: true,
  limitCommentDepth: limitCommentDepth_global,
  add_user: '',
  limit: 100, t: 'all',
  stickied: undefined,
  distinguished: undefined,
  ...urlParamKeys_max_min_defaults,
}

// pushshift max per call is now 100 (previously was 1000)
const maxN = 2000


const getMultiFilterSettings = (stringValue) => {
  const settings = {}
  stringValue.split(',').forEach(type => {
    if (type.trim()) {
      settings[type.trim()] = true
    }
  })
  return settings
}

export const create_qparams = () => new SimpleURLSearchParams(window.location.search)

export const create_qparams_and_adjust = (page_type, selection, value) => {
  const queryParams = create_qparams()
  adjust_qparams_for_selection(page_type, queryParams, selection, value)
  return queryParams
}

const parseType = (value) => {
  if (value === 'false') {
    return false
  } else if (value === 'true') {
    return true
  } else {
    return ifNumParseInt(value)
  }
}

export const adjust_qparams_for_selection = (page_type, queryParams, selection, value) => {
  value = parseType(value)
  if (value === filter_pageType_defaults[selection] ||
     (typeof(filter_pageType_defaults[selection]) === 'object' &&
      value === filter_pageType_defaults[selection][page_type])) {
    queryParams.delete(urlParamKeys[selection])
  } else {
    queryParams.set(urlParamKeys[selection], value)
  }
  return queryParams
}

export const updateURL = (queryParams) => {
  const to = `${window.location.pathname}${queryParams.toString()}`
  window.history.replaceState(null,null,to)
}


class GlobalState extends Container {
  constructor(props) {
     super(props)
     this.state = this.getInitialState()
  }

  getInitialState() {
    return {
        n: 300,
        before: '',
        before_id: '',
        keywords: '',
        post_flair: '', user_flair: '', filter_url: '',
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
        sort: 'new',
        showContext: true,
        statusText: '',
        statusImage: undefined,
        loading: false,
        error: false,
        userIssueDescription: '',
        id: '',
        context: '',
        frontPage: false,
        q: '', author: '', subreddit: '', after: '', domain: '', or_domain: '', title: '', selftext: '',
        content: 'all', url: '',
        selfposts: true,
        itemsLookup: {},
        commentTree: [],
        itemsSortedByDate: [],
        initialFocusCommentID: '',
        commentParentsAndPosts: {},
        limitCommentDepth: true,
        moderators: {},
        moderated_subreddits: {},
        authors: {},
        archiveTimes: null,
        add_user: '',
        alreadySearchedAuthors: {},
        all: false,
        oldestTimestamp: undefined, newestTimestamp: undefined,
        stickied: undefined, distinguished: undefined,
        ...urlParamKeys_max_min_defaults,
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
          stateVar[param] = parseType(value)
        }
      }
    }
  }
  saveDefaults = (page_type) => {
    const filters = get(defaultFilters_str, {})
    filters[page_type] = [
      'localSort', 'localSortReverse', 'removedFilter', 'removedByFilter', 'tagsFilter',
      'showContext', 'n', 'sort', 't',
      'categoryFilter_subreddit', 'categoryFilter_domain', 'categoryFilter_link_title',
      'num_subscribers_min', 'score_min', 'num_comments_min',
      'num_subscribers_max', 'score_max', 'num_comments_max',
      'keywords', 'post_flair', 'user_flair', 'filter_url',
    ].reduce((map,varname) => (map[varname] = this.state[varname], map), {})
    put(defaultFilters_str, filters)
  }
  resetDefaults = (page_type) => {
    const filters = get(defaultFilters_str, {})
    delete filters[page_type]
    put(defaultFilters_str, filters)
  }
  setQueryParamsFromSavedDefaults = (page_type) => {
    const filters = get(defaultFilters_str, {})
    if (filters[page_type]) {
      const queryParams = create_qparams()
      for (let [selection, value] of Object.entries(filters[page_type])) {
        if (typeof(value) === 'object') {
          value = Object.keys(value).join()
        }
        // only set the query param to the user's saved default if it is not already set
        if (! queryParams.has(selection)) {
          adjust_qparams_for_selection(page_type, queryParams, selection, value)
        }
      }
      updateURL(queryParams)
    }
  }
  context_update = (context, props, url = '') => {
    const queryParams = create_qparams_and_adjust(props.page_type, 'context', context)
    adjust_qparams_for_selection(props.page_type, queryParams, 'showContext', true)
    const to = url ? url : `${window.location.pathname}${queryParams.toString()}`
    if (url) {
      props.history.push(to)
    }
    return this.setStateFromQueryParams(props.page_type, queryParams, {})
  }
  selection_update = (selection, value, page_type, callback = () => {}) => {
    const queryParams = create_qparams_and_adjust(page_type, selection, encodeURIComponent(value))
    return this.updateURLandState(queryParams, page_type, callback)
  }
  updateURLandState = (queryParams, page_type, callback = () => {}) => {
    updateURL(queryParams)
    return this.setStateFromQueryParams(page_type, queryParams, {}, callback)
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
  resetFilters = (page_type) => {
    const queryParams = create_qparams()
    adjust_qparams_for_selection(page_type, queryParams, 'removedFilter', removedFilter_types.all)
    for (const globalVarName of Object.keys(urlParamKeys_filters_for_reset_to_show_all_items)) {
      adjust_qparams_for_selection(page_type, queryParams, globalVarName, filter_pageType_defaults[globalVarName])
    }
    return this.updateURLandState(queryParams, page_type)
  }

  setSuccess = (other = {}) => {
    if (! this.state.error) {
      return this.setState({statusText: '', statusImage: '/images/success.png', loading:false, ...other})
    } else {
      return this.setState({statusImage: '/images/error.png', loading:false, ...other})
    }
  }
  setError = (error, other = {}) => {
    return this.setState({statusText: error.message, statusImage: '/images/error.png', loading:false, error: true, ...other})
  }
  setLoading = (text = '', other = {}) => this.setState({...loadingVars, statusText: text, ...other})
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
