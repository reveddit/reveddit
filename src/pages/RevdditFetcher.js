import React from 'react'
import scrollToElement from 'scroll-to-element'
import { getRevdditCommentsBySubreddit } from 'data_processing/comments'
import { getRevdditMissingComments } from 'data_processing/missing_comments'
import { getRevdditPostsBySubreddit } from 'data_processing/subreddit_posts'
import { getRevdditPostsByDomain, getRevdditDuplicatePosts } from 'data_processing/posts'
import { getRevdditUserItems } from 'data_processing/user'
import { getRevdditThreadItems } from 'data_processing/thread'
import { getRevdditItems, getRevdditSearch } from 'data_processing/info'
import { itemIsOneOfSelectedActions, itemIsOneOfSelectedTags, filterSelectedActions } from 'data_processing/filters'
import Selections from 'pages/common/selections'
import { showAccountInfo_global } from 'pages/modals/Settings'
import { removedFilter_types, getExtraGlobalStateVars, create_qparams } from 'state'
import { NOT_REMOVED, COLLAPSED, ORPHANED } from 'pages/common/RemovedBy'
import { jumpToHash, get, put, ext_urls,
         itemIsActioned, itemIsCollapsed, commentIsOrphaned,
         commentIsMissingInThread, getPrettyDate, getPrettyTimeLength,
         archiveTimes_isCurrent, matchOrIncludes,
} from 'utils'
import { getAuthorInfoByName } from 'api/reddit'
import { getAuth } from 'api/reddit/auth'
import { getArchiveTimes } from 'api/reveddit'
import {meta} from 'pages/about/AddOns'
import Notice from 'pages/common/Notice'
import Time from 'pages/common/Time'


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
    'search': CAT_SUBREDDIT
  }
  if (page_type in category_settings) {
    if (subreddit && ! ['duplicate_posts'].includes(page_type)) {
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
  switch(page_type) {
    case 'subreddit_posts': {
      return `/r/${string}`
      break
    }
    case 'subreddit_comments': {
      return `/r/${string}/comments`
      break
    }
    case 'missing_comments': {
      return `/r/${string}: missing comments`
      break
    }
    case 'domain_posts': {
      return `/domain/${string}`
      break
    }
    case 'duplicate_posts': {
      return `/duplicates/${string}`
      break
    }
    case 'user': {
      return `/u/${string}`
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
      return [getRevdditThreadItems, [threadID, commentID, context, add_user, user_kind, user_sort, user_time, before, after]]
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
const MAX_COLLAPSED_VISIBLE = 2
const MAX_ORPHANED_VISIBLE = 2

const itemMatches = (item, searchString, fields) => {
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
      if (item[field] && matchOrIncludes(item[field].toLocaleLowerCase(), word, isPhraseRegex)) {
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

export const withFetch = (WrappedComponent) =>
  class extends React.Component {
    state = {
      items: [],
      threadPost: {},
      num_pages: 0,
      loading: true,
      showAllCollapsed: false,
      showAllOrphaned: false,
    }
    componentDidUpdate() {
      window.onpopstate  = () => {
        // back/forward button was pressed
        this.props.global.setStateFromCurrentURL(this.props.page_type)
      }
    }
    componentDidMount() {
      let subreddit = (this.props.match.params.subreddit || '').toLowerCase()
      const domain = (this.props.match.params.domain || '').toLowerCase()
      const user = (this.props.match.params.user || '' ).toLowerCase()
      const { threadID, commentID, kind = '' } = this.props.match.params
      const { userSubreddit } = (this.props.match.params.userSubreddit || '').toLowerCase()
      const allQueryParams = create_qparams()
      if (userSubreddit) {
        subreddit = 'u_'+userSubreddit
      }
      const { page_type } = this.props
      const page_title = getPageTitle(page_type, subreddit || user || domain)
      if (page_title) {
        document.title = page_title
      }
      if (page_type === 'user') {
        setTimeout(this.maybeShowSubscribeUserModal, 3000)
      } else {
        getArchiveTimes().then(archiveTimes => this.props.global.setState({archiveTimes}))
      }
      this.props.global.setQueryParamsFromSavedDefaults(page_type)
      this.props.global.setStateFromQueryParams(
                      page_type,
                      allQueryParams,
                      getExtraGlobalStateVars(page_type, allQueryParams.get('sort') ))
      .then(result => {
        if (page_type === 'info' && allQueryParams.toString() === '') {
          return this.props.global.setSuccess()
        }
        getAuth().then(() => {
          const {context, add_user, user_sort, user_kind, user_time, before, after,
                } = this.props.global.state
          const [loadDataFunction, params] = getLoadDataFunctionAndParam(
            {page_type, subreddit, user, kind, threadID, commentID, context, domain,
             add_user, user_kind, user_sort, user_time, before, after})
          loadDataFunction(...params, this.props.global, this.props.history)
          .then(() => {
            const {commentTree, items, threadPost} = this.props.global.state
            if (items.length === 0 && ['subreddit_posts', 'subreddit_comments'].includes(page_type)) {
              throw "no results"
            }
            const focusComment = this.props.global.state.itemsLookup[commentID]
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
            window.scrollY === 0 && jumpToHash(window.location.hash)
            if ((showAccountInfo_global || threadPost) && items.length) {
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
              if (showAccountInfo_global) {
                getAuthorInfoByName(Array.from(authorIDs))
                .then(authors => {
                  this.props.global.setState({authors})
                })
              } else {
                this.props.global.setState({authors: Array.from(authorNames).reduce((map, val) => (map[val] = {}, map), {})})
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

    getViewableItems(items, category, category_unique_field) {
      const gs = this.props.global.state
      const category_state = gs['categoryFilter_'+category]
      const {page_type} = this.props
      const showAllCategories = category_state === 'all'
      let numCollapsed = 0, numCollapsedNotShown = 0,
           numOrphaned = 0,  numOrphanedNotShown = 0
      const viewableItems = items.filter(item => {
        let itemIsOneOfSelectedCategory = false
        if (category_state === item[category_unique_field]) {
          itemIsOneOfSelectedCategory = true
        }
        if (['user','subreddit_comments'].includes(page_type) &&
            gs.removedFilter === removedFilter_types.removed &&
            this.props.global.removedByFilterIsUnset() &&
            this.props.global.tagsFilterIsUnset() &&
            ! commentIsMissingInThread(item)) {
          let hideItem = false
          const collapsed = itemIsCollapsed(item)
          const orphaned = commentIsOrphaned(item)
          if (collapsed) {
            numCollapsed += 1
            if (! this.state.showAllCollapsed &&
              ! (orphaned && this.state.showAllOrphaned) &&
              ! gs.removedByFilter[COLLAPSED]) {
              if (numCollapsed > MAX_COLLAPSED_VISIBLE) {
                numCollapsedNotShown += 1
                hideItem = true
              }
            }
          }
          if (orphaned) {
            numOrphaned += 1
            if (! item.deleted && ! item.removed &&
              ! this.state.showAllOrphaned &&
              ! (collapsed && this.state.showAllCollapsed) &&
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
      return {viewableItems, numCollapsedNotShown, numOrphanedNotShown}
    }

    getVisibleItemsWithoutCategoryFilter() {
      const removedByFilterIsUnset = this.props.global.removedByFilterIsUnset()
      const tagsFilterIsUnset = this.props.global.tagsFilterIsUnset()
      const visibleItems = []
      const gs = this.props.global.state
      const filteredActions = filterSelectedActions(Object.keys(gs.removedByFilter))
      gs.items.forEach(item => {
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
          ) &&
          ( (removedByFilterIsUnset || itemIsOneOfSelectedActions(item, ...filteredActions)) &&
            (tagsFilterIsUnset || itemIsOneOfSelectedTags(item, gs)))
        ) {
          const title_body_fields = ['body']
          if ('title' in item) {
            title_body_fields.push('title')
          } else if ('link_title' in item) {
            title_body_fields.push('link_title')
          }
          let match = itemMatches(item, gs.keywords, title_body_fields)
          if (match) {
            match = itemMatches(item, gs.post_flair, ['link_flair_text'])
          }
          if (match) {
            match = itemMatches(item, gs.user_flair, ['author_flair_text'])
          }
          if (match) {
            visibleItems.push(item)
          }
        }
      })
      return {visibleItemsWithoutCategoryFilter: visibleItems}
    }
    handleError = (error) => {
      console.error(error)
      if (this.props.global.state.items.length === 0) {
        document.querySelector('#donate-ribbon').style.display = 'none'
        let content = undefined
        var isFirefox = typeof InstallTrigger !== 'undefined';
        if (navigator.doNotTrack == "1" && isFirefox) {
          content =
            <>
              <p>Error: unable to connect to reddit</p>
              <p>Tracking Protection on Firefox prevents this site from accessing reddit's API. <b>To fix this</b>, add an exception by clicking the shield icon next to the URL:</p>
              <img src="/images/etp.png"/>
              <p>If this does not resolve the issue, there may be a conflicting extension blocking connections to reddit from other websites.</p>
            </>
        } else {
          content =
            <>
              <p>Error: unable to connect to either reddit or pushshift</p>
              <div>Possible causes:
                <ul>
                  <li>conflicting extensions that block connections</li>
                  <li>temporary network outage</li>
                  <li>the page contains <span className='quarantined'>quarantined</span> content that requires a <a href={ext_urls.rt.c}>Chrome</a> or <a href={ext_urls.rt.f}>Firefox</a> extension to view accurately.</li>
                </ul>
              </div>
            </>
        }
        this.props.openGenericModal({content})
      }
      this.props.global.setError('')
    }

    render () {
      const subreddit = (this.props.match.params.subreddit || '').toLowerCase()
      const domain = (this.props.match.params.domain || '').toLowerCase()
      const { page_type } = this.props
      const { items, showContext, archiveTimes } = this.props.global.state

      const visibleItemsWithoutCategoryFilter_meta = this.getVisibleItemsWithoutCategoryFilter()
      const {visibleItemsWithoutCategoryFilter} = visibleItemsWithoutCategoryFilter_meta
      const {category, category_title, category_unique_field} = getCategorySettings(page_type, subreddit)
      const {viewableItems, numCollapsedNotShown, numOrphanedNotShown} = this.getViewableItems(visibleItemsWithoutCategoryFilter, category, category_unique_field)
      const selections =
        <Selections subreddit={subreddit}
                    page_type={page_type}
                    {...visibleItemsWithoutCategoryFilter_meta}
                    num_showing={viewableItems.length}
                    num_items={items.length}
                    category_type={category} category_title={category_title}
                    category_unique_field={category_unique_field}/>
      let numCollapsedNotShownMsg = ''
      if (numCollapsedNotShown) {
          numCollapsedNotShownMsg =
            <div className='notice-with-link center' onClick={() => this.setState({showAllCollapsed: true})}>
              show {numCollapsedNotShown} collapsed comments
            </div>
      }
      let numOrphanedNotShownMsg = ''
      if (numOrphanedNotShown) {
          numOrphanedNotShownMsg =
            <div className='notice-with-link center' onClick={() => this.setState({showAllOrphaned: true})}>
              show {numOrphanedNotShown} comments whose parent or link was removed
            </div>
      }
      const notShownMsg = <>{numOrphanedNotShownMsg}{numCollapsedNotShownMsg}</>
      let archiveDelayMsg = ''
      if (archiveTimes && (archiveTimes_isCurrent(archiveTimes) || page_type === 'info') ) {
        let commentsMsg = '', submissionsMsg = ''
        if (page_type === 'info' ||
              (archiveTimes.updated - archiveTimes.submission > normalArchiveDelay
              && ['search', 'subreddit_posts', 'duplicate_posts', 'domain_posts'].includes(page_type))) {
          submissionsMsg = gridLabel('submissions', archiveTimes.submission, archiveTimes.updated)
        }
        if (page_type === 'info' ||
              (archiveTimes.updated - archiveTimes.comment > normalArchiveDelay
              && ['search', 'thread', 'subreddit_comments'].includes(page_type))) {
          commentsMsg = gridLabel('comments', archiveTimes.comment, archiveTimes.updated)
        }
        if (submissionsMsg || commentsMsg) {
          const updated = getPrettyDate(archiveTimes.updated)
          archiveDelayMsg =
            <Notice className='delay' title='archive delay' detail={'as of '+updated}
              message = {<div className='container'>{submissionsMsg}{commentsMsg}</div>} />
        }
      }
      return (
        <React.Fragment>
          <WrappedComponent {...this.props} {...this.state}
            selections={selections}
            viewableItems={viewableItems}
            notShownMsg={notShownMsg}
            archiveDelayMsg={archiveDelayMsg}
            {...visibleItemsWithoutCategoryFilter_meta}
          />
        </React.Fragment>
      )
    }
  }

const gridLabel = (label, created_utc, updated) => {
  return <>
    <div className='label'>{label}</div><Time noAgo={true} created_utc={created_utc} pretty={getPrettyTimeLength(updated - created_utc)}/>
  </>
}
