import React, {useState, useMemo} from 'react'
import scrollToElement from 'scroll-to-element'
import { getRevdditCommentsBySubreddit } from 'data_processing/comments'
import { getRevdditMissingComments } from 'data_processing/missing_comments'
import { getRevdditPostsBySubreddit } from 'data_processing/subreddit_posts'
import { getRevdditAggregations } from 'data_processing/aggregations'
import { getRevdditPostsByDomain, getRevdditDuplicatePosts } from 'data_processing/posts'
import { getRevdditUserItems } from 'data_processing/user'
import { getRevdditThreadItems } from 'data_processing/thread'
import { getRevdditItems, getRevdditSearch } from 'data_processing/info'
import { itemIsOneOfSelectedActions, itemIsOneOfSelectedTags, filterSelectedActions } from 'data_processing/filters'
import { getSortFn } from 'data_processing/sort'
import Selections from 'pages/common/selections'
import SummaryAndPagination from 'pages/common/SummaryAndPagination'
import { showAccountInfo_global } from 'pages/modals/Settings'
import { connect, removedFilter_types, getExtraGlobalStateVars, create_qparams,
         urlParamKeys_max_min,
} from 'state'
import { NOT_REMOVED, COLLAPSED, ORPHANED } from 'pages/common/RemovedBy'
import { jumpToHash, get, put,
         itemIsActioned, itemIsCollapsed, commentIsOrphaned,
         commentIsMissingInThread, getPrettyDate, getPrettyTimeLength,
         archiveTimes_isCurrent, archive_isOnline, matchOrIncludes, now, reversible,
         redirectToHistory,
} from 'utils'
import { getAuthorInfoByName } from 'api/reddit'
import { getAuth } from 'api/reddit/auth'
import { getArchiveTimes } from 'api/reveddit'
import {meta} from 'pages/about/AddOns'
import {Notice} from 'pages/common/Notice'
import Time from 'pages/common/Time'
import {RedditOrLocalLink} from 'components/Misc'
import {FaqLink} from 'pages/about/faq'
import BlankUser from 'components/BlankUser'
import Highlight from 'pages/common/Highlight'
import {SocialLinks} from 'components/Misc'

const CAT_SUBREDDIT = {category: 'subreddit',
                       category_title: 'Subreddit',
                       category_unique_field: 'subreddit'}

const CAT_POST_TITLE = {category: 'link_title',
                        category_title: 'Post Title',
                        category_unique_field: 'link_id'}

const normalArchiveDelay = 60

const getCategorySettings = (page_type, subreddit) => {
  const category_settings = {
    'subreddit_comments': {
      'other': CAT_POST_TITLE,
      'all':   CAT_SUBREDDIT
    },
    'missing_comments': {
      'other': CAT_POST_TITLE,
      'all':   CAT_SUBREDDIT
    },
    'subreddit_posts': {
      'other': {category: 'domain',
                category_title: 'Domain',
                category_unique_field: 'domain'},
      'all':   CAT_SUBREDDIT
    },
    'domain_posts': CAT_SUBREDDIT,
    'duplicate_posts': CAT_SUBREDDIT,
    'user': CAT_SUBREDDIT,
    'info': CAT_SUBREDDIT,
    'search': CAT_SUBREDDIT,
    'thread': {category: 'author',
               category_title: 'Author',
               category_unique_field: 'author'},
  }
  if (page_type in category_settings) {
    if (subreddit && ! ['duplicate_posts', 'thread'].includes(page_type)) {
      let sub_type = subreddit.toLowerCase() === 'all' ? 'all' : 'other'
      return category_settings[page_type][sub_type]
    } else {
      return category_settings[page_type]
    }
  } else {
    return {}
  }
}

const getPageTitle = (page_type, string) => {
  const subreddit = `r/${string}`
  switch(page_type) {
    case 'subreddit_posts': {
      return `${subreddit}`
      break
    }
    case 'subreddit_comments': {
      return `${subreddit}/comments`
      break
    }
    case 'aggregations': {
      return `${subreddit}/history`
      break
    }
    case 'missing_comments': {
      return `${subreddit}: missing comments`
      break
    }
    case 'domain_posts': {
      return `domain/${string}`
      break
    }
    case 'duplicate_posts': {
      return `duplicates/${string}`
      break
    }
    case 'user': {
      return `u/${string}`
      break
    }
    case 'info': {
      return 'by ID reveddit info'
      break
    }
    case 'search': {
      return 'search reveddit'
      break
    }
  }
  return null

}
const getLoadDataFunctionAndParam = (
  {page_type, subreddit, user, kind, threadID, commentID, context, domain,
   add_user, user_kind, user_sort, user_time, before, after,
  }
) => {
  switch(page_type) {
    case 'subreddit_posts': {
      return [getRevdditPostsBySubreddit, [subreddit]]
      break
    }
    case 'subreddit_comments': {
      return [getRevdditCommentsBySubreddit, [subreddit]]
      break
    }
    case 'aggregations': {
      return [getRevdditAggregations, [subreddit]]
      break
    }
    case 'missing_comments': {
      return [getRevdditMissingComments, [subreddit]]
      break
    }
    case 'domain_posts': {
      return [getRevdditPostsByDomain, [domain]]
      break
    }
    case 'duplicate_posts': {
      return [getRevdditDuplicatePosts, [threadID]]
      break
    }
    case 'thread': {
      return [getRevdditThreadItems, [threadID, commentID, context,
                                      add_user, user_kind, user_sort, user_time,
                                      before, after, subreddit,
                                     ]]
      break
    }
    case 'user': {
      return [getRevdditUserItems, [user, kind]]
      break
    }
    case 'info': {
      return [getRevdditItems, []]
      break
    }
    case 'search': {
      return [getRevdditSearch, []]
      break
    }
    default: {
      console.error('Unrecognized page type: ['+page_type+']')
    }
  }
  return null
}
const MAX_COLLAPSED_VISIBLE = 1
const MAX_ORPHANED_VISIBLE = 1

const charsToNormalize = {'‘': "'",
                        '’': "'",
                        '“': '"',
                        '”': '"',
                       }

const normalizeCharsRegex = new RegExp('['+Object.keys(charsToNormalize).join('')+']', 'g')

const normalizeChars = (s) => s.replace(normalizeCharsRegex, (match) => charsToNormalize[match], 'g')

export const textMatch = (gs, item, [globalVarName, fields]) => {
  const searchString = gs[globalVarName]
  const keywords = searchString.toString().replace(/\s\s+/g, ' ').trim().toLocaleLowerCase().match(/(-?"[^"]+"|[^"\s]+)/g) || []
  for (let i = 0; i < keywords.length; i++) {
    const negateWord = keywords[i].startsWith('-') ? true : false
    let word = keywords[i].replace(/^-/,'')
    const isPhraseRegex = word.startsWith('"') ? true : false
    if (isPhraseRegex) {
      word = word.replace(/^"(.+)"$/,"$1")
    }
    let word_in_item = false
    for (const field of fields) {
      if (item[field] && matchOrIncludes(normalizeChars(item[field].toLocaleLowerCase()), normalizeChars(word), isPhraseRegex)) {
        word_in_item = true
        break
      }
    }
    if ((! negateWord && ! word_in_item) || (negateWord && word_in_item)) {
      return false
    }
  }
  return true
}

//don't check the value for quarantined items when this function is called
const minMaxMatch_quarantine = (gs, item, args) => {
  if (item.quarantine) {
    return true
  }
  return minMaxMatch(gs, item, args)
}

const minMaxMatch = (gs, item, [globalVarBase, field, isAge=false,
                                isLength=false, isAccountAge=false, isOtherAccountMeta = false]) => {
  if ((field in item) || isAccountAge || isOtherAccountMeta) {
    const min = gs[globalVarBase+'_min']
    const max = gs[globalVarBase+'_max']
    const isMin = min !== ''
    const isMax = max !== ''
    if (isMin || isMax) {
      let value
      if (isAge) {
        value = (now - item[field])/60
      } else if (isLength) {
        value = typeof(item[field]) === 'string' ? item[field].length : 0
      } else if (isAccountAge || isOtherAccountMeta) {
        const accountFieldValue = (gs.author_fullnames[item['author_fullname']]?.[field]);
        if (isAccountAge) {
          if (accountFieldValue) {
            value = (item.created_utc - accountFieldValue)/86400
          }
        } else {
          value = accountFieldValue
        }
      } else {
        value = item[field]
      }
      if (isMin) {
        return min <= value
      } else if (isMax) {
        return value <= max
      }
    }
  }
  return true
}

const asOfMatch = (gs, item) => {
  const as_of = gs['thread_before']
  if (/^\d+$/.test(as_of)) {
    return item.created_utc <= parseInt(as_of)
  }
  return true
}

const filterMatches = (filterIsUnset, fn, exclude) => {
  if (! filterIsUnset) {
    const oneOfSelected = fn()
    if (exclude) {
      return ! oneOfSelected
    } else {
      return oneOfSelected
    }
  }
  return true
}

export const withFetch = (WrappedComponent) =>
  class extends React.Component {
    componentDidMount() {
      const {match, global} = this.props
      let subreddit = (match.params.subreddit || '').toLowerCase()
      const domain = (match.params.domain || '').toLowerCase()
      const user = (match.params.user || '' ).toLowerCase()
      const { threadID, commentID, kind = '' } = match.params
      const { page_type } = this.props
      const page_title = getPageTitle(page_type, subreddit || user || domain)
      if (page_title) {
        document.title = page_title
      }
      let archive_times_promise = Promise.resolve({})
      if (page_type === 'user') {
        setTimeout(this.maybeShowSubscribeUserModal, 3000)
      } else {
        archive_times_promise = getArchiveTimes().then(archiveTimes => global.setState({archiveTimes}))
      }
      global.setQueryParamsFromSavedDefaults(page_type)
      const allQueryParams = create_qparams()
      global.setStateFromQueryParams(
                      page_type,
                      allQueryParams,
                      getExtraGlobalStateVars(page_type, allQueryParams.get('sort') ))
      .then(result => {
        if (page_type === 'info' && allQueryParams.toString() === '') {
          return global.setSuccess()
        }
        getAuth().then(() => {
          const {context, add_user, user_sort, user_kind, user_time, before, after,
                } = global.state
          const [loadDataFunction, params] = getLoadDataFunctionAndParam(
            {page_type, subreddit, user, kind, threadID, commentID, context, domain,
             add_user, user_kind, user_sort, user_time, before, after})
          loadDataFunction(...params, global, archive_times_promise)
          .then(async ([success, stateObj]) => {
            const lookupAccountMeta = (showAccountInfo_global || global.accountFilterOrSortIsSet()) && (stateObj.items?.length || global.state.items?.length)
            const successFn = (success ? global.setSuccess : global.setError).bind(global)
            const setStateFn = lookupAccountMeta ? global.setState.bind(global) : successFn
            await setStateFn(stateObj)
            const {commentTree, items, threadPost, initialFocusCommentID} = global.state
            if (items.length === 0 && ['subreddit_posts', 'subreddit_comments'].includes(page_type)) {
              throw "no results"
            }
            const focusComment = global.state.itemsLookup[commentID]
            if ((commentID && focusComment) || commentTree.length === 1) {
              document.querySelectorAll('.threadComments .collapseToggle.hidden').forEach(toggle => {
                const comment = toggle.closest('.comment')
                if (comment
                    && (commentTree.length === 1
                     || comment.id.substr(3) in focusComment.ancestors)) {
                  toggle.click()
                }
              })
            }
            if (window.scrollY === 0) {
              let hash = window.location.hash
              if (! hash && initialFocusCommentID) {
                hash = '#t1_'+initialFocusCommentID
              }
              jumpToHash(hash)
            }
            if ((lookupAccountMeta || threadPost) && items.length) {
              const authorIDs = new Set()
              const authorNames = new Set()
              let itemsAndPost = items
              if (threadPost && (threadPost.author || threadPost.author_fullname)) {
                itemsAndPost = items.concat(threadPost)
              }
              for (const item of itemsAndPost) {
                if (item.author_fullname) {
                  authorIDs.add(item.author_fullname)
                }
                if (item.author) {
                  authorNames.add(item.author)
                }
              }
              if (lookupAccountMeta) {
                getAuthorInfoByName(Array.from(authorIDs))
                .then(({authors, author_fullnames}) => {
                  successFn({authors, author_fullnames})
                })
              } else {
                global.setState({authors: Array.from(authorNames).reduce((map, val) => (map[val] = {}, map), {})})
              }
            }
          })
          .catch(this.handleError)
        })
        .catch(this.handleError)
      })
    }
    maybeShowSubscribeUserModal = () => {
      const hasSeenSubscribeUserModal_text = 'hasSeenSubscribeUserModal'
      const extensionSaysNoSubscriptions = get('extensionSaysNoSubscriptions', false)
      const hasSeenSubscribeUserModal = get(hasSeenSubscribeUserModal_text, false)
      if (extensionSaysNoSubscriptions && ! hasSeenSubscribeUserModal) {
        put(hasSeenSubscribeUserModal_text, true)
        this.props.openGenericModal({content:
          <>
            <p>To receive alerts when content from this user is removed, click 'subscribe' on the extension icon.</p>
            <img src={meta.subscribe.img}/>
            <p>This pop-up appears once per session on user pages while there are no subscriptions.</p>
          </>
        })
      }
    }

    handleError = (error) => {
      console.error(error)
      if (error.message === 'Forbidden') {
        redirectToHistory(this.props.match.params.subreddit)
      } else if (this.props.global.state.items.length === 0) {
//        document.querySelector('#donate-ribbon').style.display = 'none'
        let content = undefined
        var isFirefox = typeof InstallTrigger !== 'undefined';
        if (navigator.doNotTrack == "1" && isFirefox) {
          content =
            <>
              <p>Error: unable to connect to reddit</p>
              <p>Tracking Protection on Firefox prevents this site from accessing reddit's API. <b>To fix this</b>, add an exception by clicking the shield icon next to the URL:</p>
              <img src="/images/etp.png"/>
              <p><RedditOrLocalLink to='/about/faq/#firefox'>Why should I disable tracking protection?</RedditOrLocalLink></p>
              <p>If this does not resolve the issue, there may be a conflicting extension blocking connections to reddit from other websites.</p>
            </>
        } else {
          content =
            <>
              <BlankUser message='During an outage, user pages still work:'
                  placeholder='username'
                  bottomMessage={<>
                    <div><RedditOrLocalLink to='/about/faq/#errors'>What happened?</RedditOrLocalLink></div>
                    <Highlight showMobile={true}/>
                    <SocialLinks/>
                  </>}/>
            </>
        }
        this.props.openGenericModal({content})
      }
      this.props.global.setError()
    }

    render () {
      return <GenericPostProcessor WrappedComponent={WrappedComponent} {...this.props}/>
    }
  }

const baseMatchFuncAndParams = [
  [minMaxMatch_quarantine, ['num_subscribers', 'subreddit_subscribers']],
  [minMaxMatch, ['num_comments', 'num_comments']],
  [minMaxMatch, ['score', 'score']],
  [minMaxMatch, ['link_score', 'link_score']],
  [minMaxMatch, ['age', 'created_utc', true]],
  [minMaxMatch, ['link_age', 'link_created_utc', true]],
  [minMaxMatch, ['comment_length', 'body', false, true]],
  [minMaxMatch, ['account_age', 'created_utc', false, false, true]],
  [minMaxMatch, ['account_combined_karma', 'combined_karma', false, false, false, true]],
  [textMatch, ['post_flair', ['link_flair_text']]],
  [textMatch, ['user_flair', ['author_flair_text']]],
  [textMatch, ['filter_url', ['url']]],
  [asOfMatch, []],
]



const GenericPostProcessor = connect((props) => {
  const subreddit = (props.match.params.subreddit || '').toLowerCase()
  const domain = (props.match.params.domain || '').toLowerCase()
  const { WrappedComponent, page_type, global } = props
  const { items, showContext, archiveTimes, localSort, localSortReverse } = global.state
  const gs = global.state
  const [showAllCollapsed, setShowAllCollapsed] = useState(false)
  const [showAllOrphaned, setShowAllOrphaned] = useState(false)

  const sortFn = getSortFn(page_type, localSort, gs)

  const getVisibleItemsWithoutCategoryFilter = () => {
    const visibleItems = []
    const filteredActions = filterSelectedActions(Object.keys(gs.removedByFilter))
    gs.items.forEach(item => {
      const actionMatch = filterMatches(
        global.removedByFilterIsUnset(),
        () => itemIsOneOfSelectedActions(item, ...filteredActions, gs.exclude_action),
        gs.exclude_action
      )
      const tagMatch = filterMatches(
        global.tagsFilterIsUnset(),
        () => itemIsOneOfSelectedTags(item, gs),
        gs.exclude_tag
      )
      if (
        (gs.removedFilter === removedFilter_types.all ||
          (
            gs.removedFilter === removedFilter_types.not_removed &&
            ! itemIsActioned(item)
          ) ||
          (
            gs.removedFilter === removedFilter_types.removed &&
            itemIsActioned(item)
          )
        ) && actionMatch && tagMatch
      ) {
        const title_body_fields = ['body']
        if ('title' in item) {
          title_body_fields.push('title')
        } else if ('link_title' in item) {
          title_body_fields.push('link_title')
        }
        const matchFuncAndParams = [...baseMatchFuncAndParams]
        matchFuncAndParams.push([textMatch, ['keywords', title_body_fields]])
        let match = true
        for (const funcAndParams of matchFuncAndParams) {
          if (match) {
            const fn = funcAndParams[0]
            match = fn(gs, item, funcAndParams[1])
          } else {
            break
          }
        }
        if (match) {
          visibleItems.push(item)
        }
      }
    })
    return {visibleItemsWithoutCategoryFilter: visibleItems}
  }
  const getViewableItems = (items, category_state, category_unique_field) => {
    const stateSaysHideComments = (
      ['user','subreddit_comments'].includes(page_type) &&
      gs.removedFilter === removedFilter_types.removed &&
      global.removedByFilterIsUnset() &&
      global.tagsFilterIsUnset()
    )
    const showAllCategories = category_state === 'all'
    let numCollapsed = 0, numCollapsedNotShown = 0,
         numOrphaned = 0,  numOrphanedNotShown = 0
    const viewableItems = items.filter(item => {
      let itemIsOneOfSelectedCategory = false
      if (! category_state || showAllCategories || category_state === item[category_unique_field]) {
        itemIsOneOfSelectedCategory = true
      } else {
        // don't count items not in the selected category
        return false
      }
      if (stateSaysHideComments && ! commentIsMissingInThread(item)) {
        let hideItem = false
        const collapsed = itemIsCollapsed(item)
        const orphaned = commentIsOrphaned(item)
        if (collapsed) {
          numCollapsed += 1
          if (! showAllCollapsed &&
            ! (orphaned && showAllOrphaned) &&
            ! gs.removedByFilter[COLLAPSED]) {
            if (numCollapsed > MAX_COLLAPSED_VISIBLE) {
              numCollapsedNotShown += 1
              hideItem = true
            }
          }
        }
        if (orphaned) {
          numOrphaned += 1
          if (! item.deleted && ! item.removed && ! item.locked &&
            ! showAllOrphaned &&
            ! (collapsed && showAllCollapsed) &&
            ! gs.removedByFilter[ORPHANED]) {
            if (numOrphaned > MAX_ORPHANED_VISIBLE) {
              numOrphanedNotShown += 1
              hideItem = true
            }
          }
        }
        if (hideItem) {
          return false
        }
      }
      return (showAllCategories || itemIsOneOfSelectedCategory)
    })
    if (sortFn) {
      // sort might be better implemented as a sort on gs.items
      // so that every filter change would not need to re-sort
      viewableItems.sort(reversible(sortFn, localSortReverse))
    }
    return {viewableItems, numCollapsedNotShown, numOrphanedNotShown}
  }
  const filterDependencies = JSON.stringify(Object.keys(urlParamKeys_max_min).map(x => gs[x])
    .concat(
      gs.thread_before,
      gs.keywords, gs.post_flair, gs.user_flair, gs.filter_url,
      gs.removedFilter,
      gs.removedByFilter, gs.exclude_action,
      gs.tagsFilter, gs.exclude_tag,
      gs.items.length,
      gs.add_user, gs.add_user_on_page_load,
      showAllOrphaned, showAllCollapsed,
      gs.localSort, gs.localSortReverse,
      gs.author_fullnames,
    ))
  const visibleItemsWithoutCategoryFilter_meta = useMemo(
    getVisibleItemsWithoutCategoryFilter,
    [filterDependencies])
  const {visibleItemsWithoutCategoryFilter} = visibleItemsWithoutCategoryFilter_meta
  const {category, category_title, category_unique_field} = getCategorySettings(page_type, subreddit)
  const category_state = (gs['categoryFilter_'+category] || '').toString()
  const {viewableItems, numCollapsedNotShown, numOrphanedNotShown} = useMemo(() =>
    getViewableItems(visibleItemsWithoutCategoryFilter, category_state, category_unique_field),
    [filterDependencies, category, category_state, category_unique_field])
  const selections =
    <Selections subreddit={subreddit}
                page_type={page_type}
                {...visibleItemsWithoutCategoryFilter_meta}
                num_showing={viewableItems.length}
                num_items={items.length}
                category_type={category} category_title={category_title}
                category_unique_field={category_unique_field}
                filterDependencies={filterDependencies}/>
  const summary =
    <SummaryAndPagination num_items={items.length}
                          num_showing={viewableItems.length}
                          page_type={page_type}
                          subreddit={subreddit}
                          category_type={category}
                          category_unique_field={category_unique_field}/>
  let numCollapsedNotShownMsg = ''
  if (numCollapsedNotShown) {
      numCollapsedNotShownMsg =
        <div className='notice-with-link center' onClick={() => setShowAllCollapsed(true)}>
          show {numCollapsedNotShown} collapsed comments
        </div>
  }
  let numOrphanedNotShownMsg = ''
  if (numOrphanedNotShown) {
      numOrphanedNotShownMsg =
        <div className='notice-with-link center' onClick={() => setShowAllOrphaned(true)}>
          show {numOrphanedNotShown} orphaned comments
        </div>
  }
  const notShownMsg = <>{numOrphanedNotShownMsg}{numCollapsedNotShownMsg}</>
  let archiveDelayMsg = ''
  if (archiveTimes && (archiveTimes_isCurrent(archiveTimes) || page_type === 'info') ) {
    let commentsMsg = '', submissionsMsg = '', offlineMsg = ''
    const archiveTime_comment = Math.max(archiveTimes.comment, archiveTimes.beta_comment)
    const starred = (archiveTime_comment === archiveTimes.beta_comment && archiveTimes.updated - archiveTimes.comment > normalArchiveDelay)
    if (page_type === 'info' ||
          (archiveTimes.updated - archiveTimes.submission > normalArchiveDelay
          && ['search', 'subreddit_posts', 'duplicate_posts', 'domain_posts'].includes(page_type))) {
      submissionsMsg = gridLabel('submissions', archiveTimes.submission, archiveTimes.updated)
    }
    const isCommentsPageType = ['search', 'thread', 'subreddit_comments'].includes(page_type)
    if (page_type === 'info' ||
          (archiveTimes.updated - archiveTime_comment > normalArchiveDelay
          && isCommentsPageType)) {
      commentsMsg = gridLabel('comments', archiveTime_comment, archiveTimes.updated, starred)
    }
    if (page_type === 'info' || (isCommentsPageType && archiveTimes.time_to_comment_overwrite)) {
      if (commentsMsg) {
        commentsMsg = <>{commentsMsg}<div></div></>
      } else {
        commentsMsg = <div className='label'>comments</div>
      }
      commentsMsg = <>{commentsMsg}<Time noAgo={true} pretty={getPrettyTimeLength(archiveTimes.time_to_comment_overwrite)} suffix=' until overwrite'/></>
    }
    if (! archive_isOnline(archiveTimes)) {
      offlineMsg = <>
        <div className='container offlineMsg'>
          <div className='label'>OFFLINE</div>
          <Time prefix='last seen ' created_utc={archiveTimes.updated}/>
          {submissionsMsg}
        </div>
        <div></div>
      </>
    }
    if (submissionsMsg || commentsMsg) {
      const last_checked = getPrettyDate(archiveTimes.last_checked)
      let modal_status_summary = <></>
      if (archiveTimes.last_down_time) {
        const modal_status_items = []
        if (archiveTimes.last_down_time < archiveTimes.updated) {
          modal_status_items.push(<>online since <Time created_utc={archiveTimes.last_down_time}/></>)
          if (archiveTimes.last_up_time_before_down_time) {
            modal_status_items.push(<>duration of last outage: <Time noAgo={true}
              pretty={getPrettyTimeLength(archiveTimes.last_down_time - archiveTimes.last_up_time_before_down_time)}/></>)
          }
        } else {
          modal_status_items.push(<Time prefix='inaccessible since ' created_utc={archiveTimes.updated}/>)
        }
        modal_status_summary = <><strong>status</strong><ul>{modal_status_items.map((el, i) => <li key={i}>{el}</li>)}</ul></>
      }
      const archive_delay_help = (<>
        {modal_status_summary}
        <p><strong>Delay</strong> indicates the archival process, called Pushshift, is behind due to a high volume of reddit content. Pushshift may also fail to archive some content. See <FaqLink id='unarchived'></FaqLink></p>
        <p><strong>Time until overwrite</strong> indicates how long comments are visible until they may be overwritten. See <RedditOrLocalLink reddit='/pgzdav'>API rewrites</RedditOrLocalLink> for more info.</p>
        {starred ? <p>* The comment delay comes from the status of Pushshift's beta API.</p> : <></>}
        <p>See <a href='/info'>/info</a> for the complete status.</p>
      </>)
      archiveDelayMsg =
        <Notice className='delay' title='archive status' detail={'as of '+last_checked} help={archive_delay_help}
          message = {<>{offlineMsg}<div className={'container ' + (offlineMsg ? 'offline' : '')}>{submissionsMsg}{commentsMsg}</div></>} />
    }
  }
  return (
    <React.Fragment>
      <WrappedComponent {...props} {...{showAllCollapsed, showAllOrphaned}}
        selections={selections}
        summary={summary}
        viewableItems={viewableItems}
        notShownMsg={notShownMsg}
        archiveDelayMsg={archiveDelayMsg}
        {...visibleItemsWithoutCategoryFilter_meta}
      />
    </React.Fragment>
  )
})


const gridLabel = (label, created_utc, updated, starred=false) => {
  return <>
    <div className={'label '+label}>{label}</div>
    <Time className={label} noAgo={true} created_utc={created_utc}
          pretty={getPrettyTimeLength(updated - created_utc) + (starred ? '*' : '')}
          suffix = ' delay'
    />
  </>
}
