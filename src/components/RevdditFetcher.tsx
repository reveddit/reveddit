declare const InstallTrigger: any

import React, { useState, useEffect, useMemo } from 'react'
import { getRevdditCommentsBySubreddit } from 'data_processing/comments'
import { getRevdditMissingComments } from 'data_processing/missing_comments'
import { getRevdditPostsBySubreddit } from 'data_processing/subreddit_posts'
import { getRevdditAggregations } from 'data_processing/aggregations'
import {
  getRevdditPostsByDomain,
  getRevdditDuplicatePosts,
} from 'data_processing/posts'
import { getRevdditUserItems } from 'data_processing/user'
import { getRevdditThreadItems } from 'data_processing/thread'
import { getRevdditItems, getRevdditSearch } from 'data_processing/info'
import {
  itemIsOneOfSelectedActions,
  itemIsOneOfSelectedTags,
  filterSelectedActions,
} from 'data_processing/filters'
import { getSortFn } from 'data_processing/sort'
import Selections from 'components/filters'
import SummaryAndPagination from 'components/common/SummaryAndPagination'
import {
  showAccountInfo_global,
  ClientIDForm,
  guideLink,
} from 'components/modals/Settings'
import { newUserModal } from 'components/modals/Misc'

import {
  useGlobalStore,
  removedFilter_types,
  getExtraGlobalStateVars,
  create_qparams,
  urlParamKeys_max_min,
} from 'state'
import { COLLAPSED, ORPHANED } from 'components/common/RemovedBy'
import {
  jumpToHash,
  get,
  put,
  itemIsActioned,
  itemIsCollapsed,
  commentIsOrphaned,
  commentIsMissingInThread,
  matchOrIncludes,
  now,
  reversible,
  redirectToHistory,
  getCustomClientID,
} from 'utils'
import { getAuthorInfoByName } from 'api/reddit'
import { getAuth } from 'api/reddit/auth'
import { getArchiveTimes } from 'api/reveddit'
import { meta } from 'pages/about/AddOns'
import { redditPrefsAppsLink } from 'pages/about/faq'
import { Notice } from 'components/common/Notice'
import { RedditOrLocalLink } from 'components/ui/Links'
import BlankUser from 'components/BlankUser'
import Highlight from 'components/common/Highlight'
import { SocialLinks, UserNameEntry } from 'components/Misc'

const CAT_SUBREDDIT = {
  category: 'subreddit',
  category_title: 'Subreddit',
  category_unique_field: 'subreddit',
}

const CAT_POST_TITLE = {
  category: 'link_title',
  category_title: 'Post Title',
  category_unique_field: 'link_id',
}

const _normalArchiveDelay = 60

let _REDDIT_ERROR_OCCURRED = false

export const handleRedditError = (error, connectedProps) => {
  _REDDIT_ERROR_OCCURRED = true
  console.error(error)
  let content = getFirefoxError()
  if (!content) {
    // if client_id is set and message is too many requests, change below message
    const customClientID = getCustomClientID()
    if (
      customClientID &&
      error?.message?.toLowerCase().includes('too many requests')
    ) {
      content = (
        <>
          <p>Reddit said "{error.message}".</p>
          <p>Try again in 5 minutes.</p>
        </>
      )
    } else if (customClientID) {
      content = (
        <>
          <p>
            Unable to connect to Reddit. Follow the {guideLink} to verify the
            API key below matches the one on {redditPrefsAppsLink}
          </p>
          <p>
            Or, check for conflicting extensions or privacy settings (see:{' '}
            {whatHappenedLink})
          </p>
          <ClientIDForm />
        </>
      )
    } else {
      content = (
        <>
          <p>
            To use Reveddit, follow this {guideLink} to create an API key of
            type "installed app", and enter its ID here.
          </p>
          {<ClientIDForm />}
        </>
      )
    }
  }
  content = (
    <>
      {content}
      <SocialLinks />
    </>
  )
  connectedProps.openGenericModal({ content })
  connectedProps.global.setError()
}
const isFirefox =
  /firefox/i.test(navigator.userAgent) || typeof InstallTrigger !== 'undefined'

const whatHappenedLink = (
  <RedditOrLocalLink to="/about/faq/#errors">What happened?</RedditOrLocalLink>
)

const getFirefoxError = () => {
  if (navigator.doNotTrack == '1' && isFirefox) {
    return (
      <>
        <p>Error: unable to connect to reddit</p>
        <p>
          Tracking Protection on Firefox may be preventing this site from
          accessing reddit's API. <b>To fix this</b>, add an exception by
          clicking the shield icon next to the URL:
        </p>
        <img src="/images/etp.png" />
        <p>
          <RedditOrLocalLink to="/about/faq/#firefox">
            Why should I disable tracking protection?
          </RedditOrLocalLink>
        </p>
        <p>
          If this does not resolve the issue, there may be a conflicting
          extension blocking connections to reddit from other websites. See{' '}
          {whatHappenedLink}
        </p>
      </>
    )
  }
  return null
}

const getCategorySettings = (page_type, subreddit) => {
  const category_settings = {
    subreddit_comments: {
      other: CAT_POST_TITLE,
      all: CAT_SUBREDDIT,
    },
    missing_comments: {
      other: CAT_POST_TITLE,
      all: CAT_SUBREDDIT,
    },
    subreddit_posts: {
      other: {
        category: 'domain',
        category_title: 'Domain',
        category_unique_field: 'domain',
      },
      all: CAT_SUBREDDIT,
    },
    domain_posts: CAT_SUBREDDIT,
    duplicate_posts: CAT_SUBREDDIT,
    user: CAT_SUBREDDIT,
    info: CAT_SUBREDDIT,
    search: CAT_SUBREDDIT,
    thread: {
      category: 'author',
      category_title: 'Author',
      category_unique_field: 'author',
    },
  }
  if (page_type in category_settings) {
    if (subreddit && !['duplicate_posts', 'thread'].includes(page_type)) {
      const sub_type = subreddit.toLowerCase() === 'all' ? 'all' : 'other'
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
  switch (page_type) {
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
const getLoadDataFunctionAndParam = ({
  page_type,
  subreddit,
  user,
  kind,
  threadID,
  commentID,
  context,
  domain,
  add_user,
  user_kind,
  user_sort,
  user_time,
  before,
  after,
}) => {
  switch (page_type) {
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
      return [
        getRevdditThreadItems,
        [
          threadID,
          commentID,
          context,
          add_user,
          user_kind,
          user_sort,
          user_time,
          before,
          after,
          subreddit,
        ],
      ]
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
      console.error('Unrecognized page type: [' + page_type + ']')
    }
  }
  return null
}
const MAX_COLLAPSED_VISIBLE = 1
const MAX_ORPHANED_VISIBLE = 1

const charsToNormalize = { '‘': "'", '’': "'", '“': '"', '”': '"' }

const normalizeCharsRegex = new RegExp(
  '[' + Object.keys(charsToNormalize).join('') + ']',
  'g'
)

const normalizeChars = s =>
  s.replace(normalizeCharsRegex, match => charsToNormalize[match], 'g')

export const textMatch = (gs, item, [globalVarName, fields]) => {
  const searchString = gs[globalVarName]
  const keywords =
    searchString
      .toString()
      .replace(/\s\s+/g, ' ')
      .trim()
      .toLocaleLowerCase()
      .match(/(-?"[^"]+"|[^"\s]+)/g) || []
  for (let i = 0; i < keywords.length; i++) {
    const negateWord = keywords[i].startsWith('-') ? true : false
    let word = keywords[i].replace(/^-/, '')
    const isPhraseRegex = word.startsWith('"') ? true : false
    if (isPhraseRegex) {
      word = word.replace(/^"(.+)"$/, '$1')
    }
    let word_in_item = false
    for (const field of fields) {
      if (
        item[field] &&
        matchOrIncludes(
          normalizeChars(item[field].toLocaleLowerCase()),
          normalizeChars(word),
          isPhraseRegex
        )
      ) {
        word_in_item = true
        break
      }
    }
    if ((!negateWord && !word_in_item) || (negateWord && word_in_item)) {
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

const minMaxMatch = (
  gs,
  item,
  [
    globalVarBase,
    field,
    isAge = false,
    isLength = false,
    isAccountAge = false,
    isOtherAccountMeta = false,
  ]
) => {
  if (field in item || isAccountAge || isOtherAccountMeta) {
    const min = gs[globalVarBase + '_min']
    const max = gs[globalVarBase + '_max']
    const isMin = min !== ''
    const isMax = max !== ''
    if (isMin || isMax) {
      let value
      if (isAge) {
        value = (now - item[field]) / 60
      } else if (isLength) {
        value = typeof item[field] === 'string' ? item[field].length : 0
      } else if (isAccountAge || isOtherAccountMeta) {
        const accountFieldValue =
          gs.author_fullnames[item['author_fullname']]?.[field]
        if (isAccountAge) {
          if (accountFieldValue) {
            value = (item.created_utc - accountFieldValue) / 86400
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
  if (!filterIsUnset) {
    const oneOfSelected = fn()
    if (exclude) {
      return !oneOfSelected
    } else {
      return oneOfSelected
    }
  }
  return true
}

export const withFetch = WrappedComponent => {
  const WithFetchComponent = props => {
    const { match, page_type } = props
    const global = useGlobalStore()

    useEffect(() => {
      const subreddit = (match.params.subreddit || '').toLowerCase()
      const domain = (match.params.domain || '').toLowerCase()
      const user = (match.params.user || '').toLowerCase()
      const { threadID, commentID, kind = '' } = match.params
      const page_title = getPageTitle(page_type, subreddit || user || domain)
      if (page_title) {
        document.title = page_title
      }
      let archive_times_promise: Promise<any> = Promise.resolve({})
      if (page_type === 'user') {
        setTimeout(() => maybeShowSubscribeUserModal(props), 3000)
      } else {
        archive_times_promise = getArchiveTimes().then(archiveTimes =>
          global.setState({ archiveTimes })
        )
      }
      global.setQueryParamsFromSavedDefaults(page_type)
      const allQueryParams = create_qparams()
      newUserModal(props)
      global
        .setStateFromQueryParams(
          page_type,
          allQueryParams,
          getExtraGlobalStateVars(page_type, allQueryParams.get('sort'))
        )
        .then(_result => {
          if (page_type === 'info' && allQueryParams.toString() === '') {
            return global.setSuccess()
          }
          return getAuth()
            .then(() => {
              const {
                context,
                add_user,
                user_sort,
                user_kind,
                user_time,
                before,
                after,
              } = global.getState()
              const [loadDataFunction, params] = getLoadDataFunctionAndParam({
                page_type,
                subreddit,
                user,
                kind,
                threadID,
                commentID,
                context,
                domain,
                add_user,
                user_kind,
                user_sort,
                user_time,
                before,
                after,
              }) as [(...args: any[]) => Promise<any>, any[]]
              loadDataFunction(...params, global, archive_times_promise)
                .then(async ([success, stateObj]) => {
                  const lookupAccountMeta =
                    (showAccountInfo_global ||
                      global.accountFilterOrSortIsSet()) &&
                    (stateObj.items?.length || global.getState().items?.length)
                  const successFn = (
                    success ? global.setSuccess : global.setError
                  ).bind(global)
                  const setStateFn = lookupAccountMeta
                    ? global.setState.bind(global)
                    : successFn
                  await setStateFn(stateObj)
                  const {
                    commentTree,
                    items,
                    threadPost,
                    initialFocusCommentID,
                    moderators,
                  } = global.getState()
                  if (
                    items.length === 0 &&
                    ['subreddit_posts', 'subreddit_comments'].includes(
                      page_type
                    )
                  ) {
                    throw 'no results'
                  }
                  const focusComment = global.getState().itemsLookup[commentID]
                  if ((commentID && focusComment) || commentTree.length === 1) {
                    document
                      .querySelectorAll(
                        '.threadComments .collapseToggle.hidden'
                      )
                      .forEach(toggle => {
                        const comment = toggle.closest('.comment')
                        if (
                          comment &&
                          (commentTree.length === 1 ||
                            comment.id.substr(3) in focusComment.ancestors)
                        ) {
                          ;(toggle as HTMLElement).click()
                        }
                      })
                  }
                  if (window.scrollY === 0) {
                    let hash = window.location.hash
                    if (!hash && initialFocusCommentID) {
                      hash = '#t1_' + initialFocusCommentID
                    }
                    jumpToHash(hash)
                  }
                  if ((lookupAccountMeta || threadPost) && items.length) {
                    const authorIDs = new Set()
                    const authorNames = new Set()
                    const adminAuthors = new Set()
                    let itemsAndPost = items
                    if (
                      threadPost &&
                      (threadPost.author || threadPost.author_fullname)
                    ) {
                      itemsAndPost = items.concat(threadPost as any)
                    }
                    for (const item of itemsAndPost) {
                      if (item.author_fullname) {
                        authorIDs.add(item.author_fullname)
                      }
                      if (item.author) {
                        authorNames.add(item.author)
                        if (item.distinguished === 'admin') {
                          adminAuthors.add(item.author)
                        } else if (item.distinguished === 'moderator') {
                          const subreddit_lc = item.subreddit.toLowerCase()
                          if (!moderators[subreddit_lc]) {
                            moderators[subreddit_lc] = {}
                          }
                          moderators[subreddit_lc][item.author] = true
                        }
                      }
                    }
                    const setIsAdmin = (authors: Record<string, any>) => {
                      for (const a of adminAuthors) {
                        if ((a as string) in authors) {
                          authors[a as string].is_admin = true
                        }
                      }
                    }
                    if (lookupAccountMeta) {
                      getAuthorInfoByName(Array.from(authorIDs)).then(
                        ({ authors, author_fullnames }) => {
                          setIsAdmin(authors)
                          successFn({ authors, author_fullnames, moderators })
                        }
                      )
                    } else {
                      const authors = Array.from(authorNames).reduce(
                        (map: Record<string, any>, val: any) => (
                          (map[val] = {}),
                          map
                        ),
                        {} as Record<string, any>
                      )
                      setIsAdmin(authors)
                      global.setState({ authors, moderators })
                    }
                  }
                })
                .catch(error => handleError(error, { ...props, global }))
            })
            .catch(e => handleRedditError(e, { ...props, global }))
        })
    }, [])

    return (
      <GenericPostProcessor
        WrappedComponent={WrappedComponent}
        {...props}
        global={global}
      />
    )
  }
  return WithFetchComponent
}

const maybeShowSubscribeUserModal = props => {
  const hasSeenSubscribeUserModal_text = 'hasSeenSubscribeUserModal'
  const extensionSaysNoSubscriptions = get(
    'extensionSaysNoSubscriptions',
    false
  )
  const hasSeenSubscribeUserModal = get(hasSeenSubscribeUserModal_text, false)
  if (extensionSaysNoSubscriptions && !hasSeenSubscribeUserModal) {
    put(hasSeenSubscribeUserModal_text, true)
    props.openGenericModal({
      content: (
        <>
          <p>
            To receive alerts when content from this user is removed, click
            'subscribe' on the extension icon.
          </p>
          <img src={meta.subscribe.img} />
          <p>
            This pop-up appears once per session on user pages while there are
            no subscriptions.
          </p>
        </>
      ),
    })
  }
}

const handleError = (error, props) => {
  console.error(error)
  const subreddit = props.match.params.subreddit
  if (error.message === 'Forbidden') {
    redirectToHistory(subreddit)
  } else if (props.global.getState().items.length === 0) {
    let content = getFirefoxError()
    if (!content) {
      if (props.page_type.match(/^subreddit_/)) {
        redirectToHistory(subreddit, '#subreddit_unavailable')
      } else {
        return handleRedditError(error, props)
      }
      content = (
        <>
          <BlankUser
            message="During an outage, user pages still work:"
            placeholder="username"
            bottomMessage={
              <>
                <div>{whatHappenedLink}</div>
                <Highlight showMobile={true} />
              </>
            }
          />
        </>
      )
    }
    content = (
      <>
        {content}
        <SocialLinks />
      </>
    )
    props.openGenericModal({ content })
  }
  props.global.setError()
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
  [
    minMaxMatch,
    ['account_combined_karma', 'combined_karma', false, false, false, true],
  ],
  [textMatch, ['post_flair', ['link_flair_text']]],
  [textMatch, ['user_flair', ['author_flair_text']]],
  [textMatch, ['filter_url', ['url']]],
  [asOfMatch, []],
]

const GenericPostProcessor = props => {
  const subreddit = (props.match.params.subreddit || '').toLowerCase()
  const _domain = (props.match.params.domain || '').toLowerCase()
  const { WrappedComponent, page_type } = props
  const global = useGlobalStore()
  const {
    items,
    showContext: _showContext,
    archiveTimes: _archiveTimes,
    localSort,
    localSortReverse,
  } = global.state
  const gs = global.state
  const [showAllCollapsed, setShowAllCollapsed] = useState(false)
  const [showAllOrphaned, setShowAllOrphaned] = useState(false)

  const sortFn = getSortFn(page_type, localSort, gs)

  const getVisibleItemsWithoutCategoryFilter = () => {
    const visibleItems = []
    const filteredActions = filterSelectedActions(
      Object.keys(gs.removedByFilter)
    )
    gs.items.forEach(item => {
      const actionMatch = filterMatches(
        global.removedByFilterIsUnset(),
        () =>
          itemIsOneOfSelectedActions(
            item,
            ...(filteredActions as [any, any]),
            gs.exclude_action
          ),
        gs.exclude_action
      )
      const tagMatch = filterMatches(
        global.tagsFilterIsUnset(),
        () => itemIsOneOfSelectedTags(item, gs),
        gs.exclude_tag
      )
      if (
        (gs.removedFilter === removedFilter_types.all ||
          (gs.removedFilter === removedFilter_types.not_removed &&
            !itemIsActioned(item)) ||
          (gs.removedFilter === removedFilter_types.removed &&
            itemIsActioned(item))) &&
        actionMatch &&
        tagMatch
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
            const fn = funcAndParams[0] as any
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
    return { visibleItemsWithoutCategoryFilter: visibleItems }
  }
  const getViewableItems = (items, category_state, category_unique_field) => {
    const stateSaysHideComments =
      ['user', 'subreddit_comments'].includes(page_type) &&
      gs.removedFilter === removedFilter_types.removed &&
      global.removedByFilterIsUnset() &&
      global.tagsFilterIsUnset()
    const showAllCategories = category_state === 'all'
    let numCollapsed = 0,
      numCollapsedNotShown = 0,
      numOrphaned = 0,
      numOrphanedNotShown = 0
    const viewableItems = items.filter(item => {
      if (
        category_state &&
        !showAllCategories &&
        !category_state
          .toLowerCase()
          .split(',')
          .includes(item[category_unique_field].toLowerCase())
      ) {
        // don't count items not in the selected category
        return false
      }
      if (stateSaysHideComments && !commentIsMissingInThread(item)) {
        let hideItem = false
        const collapsed = itemIsCollapsed(item)
        const orphaned = commentIsOrphaned(item)
        if (collapsed) {
          numCollapsed += 1
          if (
            !showAllCollapsed &&
            !(orphaned && showAllOrphaned) &&
            !gs.removedByFilter[COLLAPSED]
          ) {
            if (numCollapsed > MAX_COLLAPSED_VISIBLE) {
              numCollapsedNotShown += 1
              hideItem = true
            }
          }
        }
        if (orphaned) {
          numOrphaned += 1
          if (
            !item.deleted &&
            !item.removed &&
            !item.locked &&
            !showAllOrphaned &&
            !(collapsed && showAllCollapsed) &&
            !gs.removedByFilter[ORPHANED]
          ) {
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
      return true
    })
    if (sortFn) {
      // sort might be better implemented as a sort on gs.items
      // so that every filter change would not need to re-sort
      viewableItems.sort(reversible(sortFn, localSortReverse))
    }
    return { viewableItems, numCollapsedNotShown, numOrphanedNotShown }
  }
  const filterDependencies = JSON.stringify(
    Object.keys(urlParamKeys_max_min)
      .map(x => gs[x])
      .concat(
        gs.thread_before,
        gs.keywords,
        gs.post_flair,
        gs.user_flair,
        gs.filter_url,
        gs.removedFilter,
        gs.removedByFilter,
        gs.exclude_action,
        gs.tagsFilter,
        gs.exclude_tag,
        gs.items.length,
        gs.add_user,
        gs.add_user_on_page_load,
        showAllOrphaned,
        showAllCollapsed,
        gs.localSort,
        gs.localSortReverse,
        gs.author_fullnames
      )
  )
  const visibleItemsWithoutCategoryFilter_meta = useMemo(
    getVisibleItemsWithoutCategoryFilter,
    [filterDependencies]
  )
  const { visibleItemsWithoutCategoryFilter } =
    visibleItemsWithoutCategoryFilter_meta
  const { category, category_title, category_unique_field } =
    getCategorySettings(page_type, subreddit)
  const category_state = (gs['categoryFilter_' + category] || '').toString()
  const { viewableItems, numCollapsedNotShown, numOrphanedNotShown } = useMemo(
    () =>
      getViewableItems(
        visibleItemsWithoutCategoryFilter,
        category_state,
        category_unique_field
      ),
    [filterDependencies, category, category_state, category_unique_field]
  )
  const selections = (
    <Selections
      subreddit={subreddit}
      {...visibleItemsWithoutCategoryFilter_meta}
      num_showing={viewableItems.length}
      num_items={items.length}
      category_type={category}
      category_title={category_title}
      category_unique_field={category_unique_field}
      filterDependencies={filterDependencies}
    />
  )
  const summary = (
    <SummaryAndPagination
      num_items={items.length}
      num_showing={viewableItems.length}
      subreddit={subreddit}
      category_type={category}
      category_unique_field={category_unique_field}
    />
  )
  let numCollapsedNotShownMsg = ''
  if (numCollapsedNotShown) {
    numCollapsedNotShownMsg = (
      <div
        className="notice-with-link center"
        onClick={() => setShowAllCollapsed(true)}
      >
        show {numCollapsedNotShown} collapsed comments
      </div>
    )
  }
  let numOrphanedNotShownMsg = ''
  if (numOrphanedNotShown) {
    numOrphanedNotShownMsg = (
      <div
        className="notice-with-link center"
        onClick={() => setShowAllOrphaned(true)}
      >
        show {numOrphanedNotShown} orphaned comments
      </div>
    )
  }
  const notShownMsg = (
    <>
      {numOrphanedNotShownMsg}
      {numCollapsedNotShownMsg}
    </>
  )
  const userEntryBox = (
    <Notice
      title="your account history"
      message={<UserNameEntry style={{ marginTop: '5px' }} />}
    />
  )

  return (
    <React.Fragment>
      <WrappedComponent
        {...props}
        global={global}
        {...{ showAllCollapsed, showAllOrphaned }}
        selections={selections}
        summary={summary}
        viewableItems={viewableItems}
        notShownMsg={notShownMsg}
        topNotice={userEntryBox}
        {...visibleItemsWithoutCategoryFilter_meta}
      />
    </React.Fragment>
  )
}
