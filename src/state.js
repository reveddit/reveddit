import React from 'react'
import { Subscribe, Container } from 'unstated'
import { SimpleURLSearchParams, get, put, ifNumParseInt, swapKeysAndValues } from 'utils'
import { limitCommentDepth_global } from 'pages/modals/Settings'
import { agg_defaults_for_page } from 'api/reveddit'
import { pageTypes } from 'pages/DefaultLayout'
import {UNKNOWN_REMOVED, USER_REMOVED} from 'pages/common/RemovedBy'
const defaultFilters_str = 'defaultFilters'

export const hasClickedRemovedUserCommentContext = () => {
  put('hasClickedRemovedUserCommentContext', true)
}

const loadingVars = {statusText: '', statusImage: '/images/loading.gif', loading:true}

export const getExtraGlobalStateVars = (page_type, sort) => {
  //when condition is true, set the var to true, otherwise keep the locally stored var value
  const extraGlobalStateVars = {
    hasVisitedUserPage: page_type === 'user',
    hasVisitedUserPage_sortTop: page_type === 'user' && sort === 'top',
    hasVisitedSubredditPage: page_type === pageTypes.subreddit_posts,
    hasClickedRemovedUserCommentContext: false,
    hasVisitedTopRemovedPage: page_type === pageTypes.aggregations,
  }
  const results = {}
  for (const [varName, condition] of Object.entries(extraGlobalStateVars)) {
    results[varName] = false
    if (get(varName, null)) {
      results[varName] = true
    } else if (condition) {
      results[varName] = true
      put(varName, true)
    }
  }
  return {...results, ...loadingVars}
}

export const urlParamKeys_account_max_min_base = {
  account_age: 'account_age',
  account_combined_karma: 'account_combined_karma',
}

const urlParamKeys_max_min_base = {
  num_subscribers: 'num_subscribers',
  score: 'score',
  num_comments: 'num_comments',
  age: 'age',
  link_age: 'link_age',
  link_score: 'link_score',
  comment_length: 'comment_length',
  ...urlParamKeys_account_max_min_base,
}
const MIN = '_min', MAX = '_max'
export const urlParamKeys_max_min = Object.keys(urlParamKeys_max_min_base)
  .reduce((map,key) => {
    map[key+MIN] = key+MIN
    map[key+MAX] = key+MAX
    return map
  }, {})

const urlParamKeys_max_min_defaults = Object.keys(urlParamKeys_max_min).reduce((m, k) => (m[k] = '', m), {})

// separate b/c I don't want to remove backslashes from the value of these on page load in src/index.js.
// need to remove backslashes from other param values due to bug with reddit text editor
// e.g.
//    created on new reddit: ?localSort=num_comments
//    appears on old reddit: ?localSort=num\_comments
// also: unable to encode _ character in URL b/c history.replaceState and pushState decode it for some reason.
//       so if someone creates a link on new reddit with a below filter that has a value containing _ then it will be wrong on old reddit.
//       should rarely happen
export const urlParamKeys_textFilters = {
  keywords: 'keywords',
  post_flair: 'post_flair',
  user_flair: 'user_flair',
  filter_url: 'filter_url',
  thread_before: 'thread_before',
}

//everything except removedFilter can use the default value when resetting to show all items
const urlParamKeys_filters_for_reset_to_show_all_items = {
  removedByFilter: 'removedby',
  exclude_action: 'exclude_action',
  exclude_tag: 'exclude_tag',
  categoryFilter_subreddit: 'subreddit',
  categoryFilter_domain: 'domain',
  categoryFilter_link_title: 'link_title',
  categoryFilter_author: 'author',
  tagsFilter: 'tags',
  ...urlParamKeys_textFilters,
  ...urlParamKeys_max_min,
}

const excludeMaps = {
  exclude_action: 'removedByFilter',
  exclude_tag: 'tagsFilter',
}

const excludeMapsReversed = swapKeysAndValues(excludeMaps)

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
  ps_after: 'ps_after',
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
  t: 't', sort: 'sort', sort_type: 'sort_type', limit: 'limit', show: 'show', all:'all', stickied: 'stickied', distinguished: 'distinguished',
  rate_less: 'rate_less', rate_more: 'rate_more',
  x_subreddit: 'x_subreddit',
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
  account_age: 'account_age',
  account_combined_karma: 'account_combined_karma',
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
  exclude_action: false,
  exclude_tag: false,
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
  categoryFilter_author: 'all',
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
  sort_type: '',
  before: '',
  before_id: '',
  keywords: '',
  post_flair: '', user_flair: '', filter_url: '', thread_before: '',
  id: '',
  context: '',
  frontPage: false,
  q: '', author: '', subreddit: '', after: '', domain: '', or_domain: '', title: '', selftext: '',
  ps_after: '',
  url: '',
  selfposts: true,
  limitCommentDepth: limitCommentDepth_global,
  add_user: '',
  add_user_on_page_load: undefined,
  limit: 100, t: 'all',
  stickied: undefined,
  distinguished: undefined,
  ...urlParamKeys_max_min_defaults,
}

const getMultiFilterSettings = (stringValue) => {
  const settings = {}
  stringValue.split(',').forEach(type => {
    if (type.trim()) {
      settings[type.trim()] = true
    }
  })
  return settings
}

const siteDefaultsThatAddParamsToURL = {
  subreddit_comments: {
    removedByFilter: getMultiFilterSettings([UNKNOWN_REMOVED, USER_REMOVED].join(',')),
    exclude_action: true,
  }
}

const initialState = {
  n: 300,
  before: '',
  before_id: '',
  keywords: '',
  post_flair: '', user_flair: '', filter_url: '', thread_before: '',
  items: [],
  threadPost: {},
  num_pages: 0,
  userNext: null,
  removedFilter: removedFilter_types.all,
  removedByFilter: {},
  exclude_action: false,
  exclude_tag: false,
  tagsFilter: {},
  categoryFilter_subreddit: 'all',
  categoryFilter_domain: 'all',
  categoryFilter_link_title: 'all',
  categoryFilter_author: 'all',
  localSort: localSort_types.date,
  localSortReverse: false,
  sort: 'new',
  sort_type: '',
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
  ps_after: '',
  content: 'all', url: '',
  over18: undefined,
  selfposts: true,
  itemsLookup: {},
  commentTree: [],
  itemsSortedByDate: [],
  initialFocusCommentID: '',
  commentParentsAndPosts: {},
  userCommentsByPost: {},
  limitCommentDepth: true,
  moderators: {},
  moderated_subreddits: {},
  authors: {}, author_fullnames: {},
  archiveTimes: null,
  add_user: '',
  alreadySearchedAuthors: {},
  all: false,
  oldestTimestamp: undefined, newestTimestamp: undefined,
  stickied: undefined, distinguished: undefined,
  rate_less: undefined, rate_more: undefined,
  rate_least: undefined, rate_most: undefined,
  ...urlParamKeys_max_min_defaults,
  agg_most_recent_created_utc: undefined,
  x_subreddit: '',
}

// pushshift max per call is now 100 (previously was 1000)
const maxN = 2000

export const create_qparams = (path_and_search) => new SimpleURLSearchParams(path_and_search ?
                                                                             new URL(path_and_search, window.location.origin).search
                                                                             : window.location.search)

export const create_qparams_and_adjust = (page_type, selection, value) => {
  const queryParams = create_qparams()
  adjust_qparams_for_selection(page_type, queryParams, selection, value)
  return queryParams
}

const parseType = (value) => {
  if (value !== null && typeof(value) === 'object') {
    return Object.keys(value).join()
  } else if (value === 'false') {
    return false
  } else if (value === 'true') {
    return true
  } else {
    return ifNumParseInt(value)
  }
  return value
}

export const adjust_qparams_for_selection = (page_type, queryParams, selection, value) => {
  value = parseType(value)
  if (value === filter_pageType_defaults[selection]
       || (typeof(filter_pageType_defaults[selection]) === 'object'
          && (value === filter_pageType_defaults[selection][page_type]
            //don't set url parameter when the value is equal to the initial state
            || (! (page_type in filter_pageType_defaults[selection])
              && value === initialState[selection])))
    ) {
    queryParams.delete(urlParamKeys[selection])
  } else {
    queryParams.set(urlParamKeys[selection], value)
  }
  return queryParams
}

export const updateURL = (queryParams) => {
  const to = `${window.location.pathname}${queryParams.toString()}${window.location.hash}`
  window.history.replaceState(null,null,to)
}

const queryParamsOnPageLoad = create_qparams()

export const getPageType = (page_type) => {
  return (page_type === 'info' && queryParamsOnPageLoad.get('url')) ?
    'duplicate_posts' : page_type
}

class GlobalState extends Container {
  constructor(props) {
     super(props)
     this.state = initialState
  }

  setStateFromCurrentURL = (page_type) => {
    return this.setStateFromQueryParams(page_type, create_qparams())
  }
  updateURLFromGivenState = (page_type, state) => {
    const queryParams = create_qparams()
    for (const [key, value] of Object.entries(state)) {
      adjust_qparams_for_selection(page_type, queryParams, key, value)
    }
    updateURL(queryParams)
  }
  getStateFromQueryParams(page_type, queryParams, extraGlobalStateVars = {}) {
    if (! page_type) {
      console.error('page_type is undefined')
    }
    page_type = getPageType(page_type)
    const stateVar = extraGlobalStateVars
    for (const [param, urlParamKey] of Object.entries(urlParamKeys)) {
      const paramValue = queryParams.get(urlParamKey)
      const paramValue_decoded = paramValue === null ? paramValue : decodeURIComponent(paramValue)
      this.setValuesForParam(param, paramValue_decoded, stateVar, page_type)
    }
    return stateVar
  }
  setStateFromQueryParams(page_type, queryParams, extraGlobalStateVars = {}) {
    return this.setState(this.getStateFromQueryParams(page_type, queryParams, extraGlobalStateVars))
  }
  setValuesForParam(param, value, stateVar, page_type) {
    if (value === null) {
      if (param in filter_pageType_defaults) {
        if (typeof(filter_pageType_defaults[param]) !== 'object') {
          stateVar[param] = filter_pageType_defaults[param]
        } else if (page_type in filter_pageType_defaults[param]) {
          stateVar[param] = filter_pageType_defaults[param][page_type]
        } else {
          stateVar[param] = initialState[param]
        }
      }
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
        case 'after':
        case 'before': {
          if (! value.includes('_')) {
            stateVar[param] = parseType(value)
          } else if (page_type === 'user') {
            stateVar[param] = value
          }
          break
        }
        case 'ps_after':
          // don't parse type
          // code expects a splittable string for value of '123456789'
          stateVar[param] = value
          break
        default: {
          stateVar[param] = parseType(value)
        }
      }
    }
  }
  saveDefaults = (page_type) => {
    const filters = get(defaultFilters_str, {})
    filters[page_type] = [
      'localSort', 'localSortReverse', 'removedFilter', 'removedByFilter', 'exclude_action', 'tagsFilter', 'exclude_tag',
      'showContext', 'n', 'sort', 't',
      'categoryFilter_subreddit', 'categoryFilter_domain', 'categoryFilter_link_title', 'categoryFilter_author',
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
    const userFilters = get(defaultFilters_str, {})
    let filters_pageType, defaultsAreFromSite = false
    if (userFilters[page_type]) {
      filters_pageType = userFilters[page_type]
    } else {
      filters_pageType = siteDefaultsThatAddParamsToURL[page_type]
      defaultsAreFromSite = true
    }
    if (filters_pageType) {
      const origQueryParams = create_qparams()
      const queryParams = create_qparams()
      for (let [selection, value] of Object.entries(filters_pageType)) {
        if (typeof(value) === 'object') {
          value = Object.keys(value).join()
        }
        // don't set site defaults for Action when user has applied a status that is not 'removed'
        if (  ['removedByFilter',excludeMapsReversed.removedByFilter].includes(selection)
              && defaultsAreFromSite
              && origQueryParams.get(urlParamKeys.removedFilter)
              && filter_pageType_defaults.removedFilter[page_type] === removedFilter_types.removed) {
          continue
        }
        // set the query param to the user's saved default if it is not already set
        if (! queryParams.has(urlParamKeys[selection])) {
          // if exclude_[tag,action] is set to true by default,
          // and there is a value in the corresponding filter (tagsFilter or removedByFilter), don't set the exclude_ filter
          if ( value && selection.match(/^exclude_/) && origQueryParams.get(urlParamKeys[excludeMaps[selection]])) {
            continue
          }
          adjust_qparams_for_selection(page_type, queryParams, selection, value)
        }
      }
      updateURL(queryParams)
    }
  }
  context_update = (context, page_type, history, path_and_search = '') => {
    const queryParams = create_qparams(path_and_search)
    adjust_qparams_for_selection(page_type, queryParams, 'context', context)
    adjust_qparams_for_selection(page_type, queryParams, 'showContext', true)
    const to = (path_and_search ? new URL(path_and_search, window.location.origin).pathname : window.location.pathname)
               + queryParams.toString()
    if (path_and_search) {
      history.push(to)
    } else {
      history.replace(to)
    }
    return this.setStateFromQueryParams(page_type, queryParams, {})
  }
  selection_update = (selection, value, page_type, other = {}) => {
    const queryParams = create_qparams_and_adjust(page_type, selection, value)
    return this.updateURLandState(queryParams, page_type, other)
  }
  updateURLandState = (queryParams, page_type, other = {}) => {
    updateURL(queryParams)
    return this.setStateFromQueryParams(page_type, queryParams, other)
  }
  categoryFilter_update = (type, value, page_type) => {
    this.selection_update('categoryFilter_'+type, value, page_type)
  }
  removedFilter_update = (value, page_type) => {
    const queryParams = create_qparams()
    if (value !== removedFilter_types.removed) {
      queryParams.delete(urlParamKeys.removedByFilter)
      queryParams.delete(urlParamKeys.exclude_action)
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
  // updates URL with new ps_after and returns string value.
  // then it can be included the next call to setState() or setSuccess()
  get_updated_ps_after = (ps_after_entry, ps_after = this.state.ps_after) => {
    const ps_after_list = ps_after ? ps_after.split(',') : []
    if (ps_after_entry) {
      ps_after_list.push(ps_after_entry)
    }
    const new_ps_after = ps_after_list.join(',')
    updateURL(create_qparams_and_adjust('thread', 'ps_after', new_ps_after))
    return new_ps_after
  }


  removedByFilterIsUnset () {
    return Object.keys(this.state.removedByFilter).length === 0
  }
  tagsFilterIsUnset () {
    return Object.keys(this.state.tagsFilter).length === 0
  }
  resetFilters = (page_type, set = {}) => {
    const queryParams = create_qparams()
    adjust_qparams_for_selection(page_type, queryParams, 'removedFilter', removedFilter_types.all)
    for (const globalVarName of Object.keys(urlParamKeys_filters_for_reset_to_show_all_items)) {
      adjust_qparams_for_selection(page_type, queryParams, globalVarName, filter_pageType_defaults[globalVarName])
    }
    for (const [globalVarName, value] of Object.entries(set)) {
      adjust_qparams_for_selection(page_type, queryParams, globalVarName, value)
    }
    return this.updateURLandState(queryParams, page_type)
  }
  accountFilterOrSortIsSet = () => {
    if (this.state.localSort.startsWith('account_')) {
      return true
    }
    for (const base of Object.keys(urlParamKeys_account_max_min_base)) {
      if (this.state[base+MIN] !== '' || this.state[base+MAX] !== '') {
        return true
      }
    }
    return false
  }
  accountMetaQueryParamIsSet = () => {
    const qparams = create_qparams()
    for (const base of Object.values(urlParamKeys_account_max_min_base)) {
      if ( qparams.has(base+MIN) || qparams.has(base+MAX) ) {
        return true
      }
    }
    return false
  }
  returnError = async (stateObj = {}) => [false, stateObj]
  returnSuccess = async (stateObj = {}) => [true, stateObj]
  setSuccess = (other = {}) => {
    if (! this.state.error) {
      return this.setState({statusText: '', statusImage: '/images/success.png', loading:false, ...other})
    } else {
      return this.setState({statusImage: '/images/error.png', loading:false, ...other})
    }
  }
  setError = (other = {}) => {
    return this.setState({statusText: '', statusImage: '/images/error.png', loading:false, error: true, ...other})
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
