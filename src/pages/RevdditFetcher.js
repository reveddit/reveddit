import React from 'react'
import scrollToElement from 'scroll-to-element'
import { getRevdditComments } from 'data_processing/subreddit_comments'
import { getRevdditPostsBySubreddit } from 'data_processing/subreddit_posts'
import { getRevdditPostsByDomain } from 'data_processing/posts'
import { getRevdditUserItems, getQueryParams } from 'data_processing/user'
import { getRevdditThreadItems } from 'data_processing/thread'
import { getRevdditItems } from 'data_processing/info'
import { itemIsOneOfSelectedRemovedBy } from 'data_processing/filters'
import Selections from 'pages/common/selections'
import { removedFilter_types } from 'state'
import { NOT_REMOVED } from 'pages/common/RemovedBy'
import { SimpleURLSearchParams, itemIsALockedPost, get, put } from 'utils'

const getCategorySettings = (page_type, subreddit) => {
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
    },
    'domain_posts': {category: 'subreddit',
                     category_title: 'Subreddit',
                     category_unique_field: 'subreddit'},
    'user': {category: 'subreddit',
             category_title: 'Subreddit',
             category_unique_field: 'subreddit'},
    'info': {category: 'subreddit',
             category_title: 'Subreddit',
             category_unique_field: 'subreddit'}
  }
  if (page_type in category_settings) {
    if (subreddit) {
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
    case 'domain_posts': {
      return `/domain/${string}`
      break
    }
    case 'user': {
      return `/u/${string}`
      break
    }
    case 'info': {
      return `by ID revddit info`
      break
    }
  }
  return null

}
const getLoadDataFunctionAndParam = (page_type, subreddit, user, kind, threadID, domain, queryParams) => {
  switch(page_type) {
    case 'subreddit_posts': {
      return [getRevdditPostsBySubreddit, [subreddit]]
      break
    }
    case 'subreddit_comments': {
      return [getRevdditComments, [subreddit]]
      break
    }
    case 'domain_posts': {
      return [getRevdditPostsByDomain, [domain]]
      break
    }
    case 'thread': {
      return [getRevdditThreadItems, [threadID]]
      break
    }
    case 'user': {
      return [getRevdditUserItems, [user, kind, queryParams]]
      break
    }
    case 'info': {
      return [getRevdditItems, []]
      break
    }
    default: {
      console.error('Unrecognized page type: ['+page_type+']')
    }
  }
  return null
}
const OVERVIEW = 'overview', SUBMITTED = 'submitted', BLANK='', COMMENTS='comments'
const acceptable_kinds = [OVERVIEW, COMMENTS, SUBMITTED, BLANK]
const acceptable_sorts = ['new', 'top', 'controversial', 'hot']

export const withFetch = (WrappedComponent) =>
  class extends React.Component {
    state = {
      items: [],
      threadPost: {},
      num_pages: 0,
      loading: true
    }
    componentDidMount() {
      let subreddit = (this.props.match.params.subreddit || '').toLowerCase()
      const domain = (this.props.match.params.domain || '').toLowerCase()
      const user = (this.props.match.params.user || '' ).toLowerCase()
      const { threadID, kind = '' } = this.props.match.params
      const { userSubreddit } = (this.props.match.params.userSubreddit || '').toLowerCase()
      const queryParams = getQueryParams()
      if (userSubreddit) {
        subreddit = 'u_'+userSubreddit
      }
      const { page_type } = this.props
      const page_title = getPageTitle(page_type, subreddit || user)
      if (page_title) {
        document.title = page_title
      }
      if (page_type === 'user') {
        if (! acceptable_kinds.includes(kind)) {
          this.props.global.setError(Error('Invalid page, check url'))
          return
        }
        if (! acceptable_sorts.includes(queryParams.sort)) {
          this.props.global.setError(Error('Invalid sort type, check url'))
          return
        }
      }
      let hasVisitedUserPage = false
      if (get('hasVisitedUserPage', null)) {
        hasVisitedUserPage = true
      } else if (page_type === 'user') {
        hasVisitedUserPage = true
        put('hasVisitedUserPage', true)
      }
      this.props.global.setStateFromQueryParams(
                      page_type,
                      new SimpleURLSearchParams(this.props.location.search),
                      {hasVisitedUserPage})
      .then(result => {

        const [loadDataFunction, params] = getLoadDataFunctionAndParam(page_type, subreddit, user, kind, threadID, domain, queryParams)
        loadDataFunction(...params, this.props.global, this.props.history)
        .then(items => {
          this.jumpToHash()
        })
        .catch(error => {
          console.error(error)
          let modalContent = undefined
          if (navigator.doNotTrack == "1") {
            modalContent =
              <>
                <p>Error: unable to connect to reddit</p>
                <p>To view this site with Firefox, add an exception for revddit by clicking the shield icon next to the URL:</p>
                <img src="https://i.imgur.com/b1ShxoM.png"/>
              </>
          } else {
            modalContent =
              <>
                <p>Error: unable to connect to either reddit or pushshift</p>
                <p>Possible causes:
                  <ul>
                    <li>conflicting extensions that block connections</li>
                    <li>temporary network outage</li>
                    <li>the page contains <span className='quarantined'>quarantined</span> content that requires a <a href="https://chrome.google.com/webstore/detail/revddit-quarantined/cmfgeilnphkjendelakiniceinhjonfh">Chrome</a> or <a href="https://addons.mozilla.org/en-US/firefox/addon/revddit-quarantined/">Firefox</a> extension to view accurately.</li>
                  </ul>
                </p>
              </>
          }
          this.props.openErrorModal(modalContent)
          this.props.global.setError('')
        })
      })
    }

    jumpToHash () {
      const hash = this.props.history.location.hash;
      if (hash) {
        scrollToElement(hash, { offset: -10 });
      }
    }
    getViewableItems(items) {
      const subreddit = (this.props.match.params.subreddit || '').toLowerCase()
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
      gs.items.forEach(item => {
        if (
          (gs.removedFilter === removedFilter_types.all ||
            (gs.removedFilter === removedFilter_types.not_removed &&
              (! item.removed && item.removedby === NOT_REMOVED) ) ||
            (
              gs.removedFilter === removedFilter_types.removed &&
                (item.deleted || item.removed || itemIsALockedPost(item) ||
                (item.removedby && item.removedby !== NOT_REMOVED))
            )
          ) &&
          (removedByFilterIsUnset || itemIsOneOfSelectedRemovedBy(item, gs))
        ) {
          const keywords = gs.keywords.replace(/\s\s+/g, ' ').trim().toLocaleLowerCase().split(' ')
          let match = true
          let titleField = ''
          if ('title' in item) {
            titleField = 'title'
          } else if ('link_title' in item) {
            titleField = 'link_title'
          }
          for (let i = 0; i < keywords.length; i++) {
            const word = keywords[i]
            let word_in_title = true
            if (titleField) {
              word_in_title = item[titleField].toLocaleLowerCase().includes(word)
            }
            if (! (('body' in item && ( word_in_title || item.body.toLocaleLowerCase().includes(word))) ||
                  (word_in_title)
            )) {
              match = false
              break
            }
          }
          if (match) {
            visibleItems.push(item)
          }
        }
      })
      return visibleItems
    }

    render () {
      const subreddit = (this.props.match.params.subreddit || '').toLowerCase()
      const domain = (this.props.match.params.domain || '').toLowerCase()
      const { page_type } = this.props
      const { items, showContext } = this.props.global.state

      let visibleItemsWithoutCategoryFilter = []
      let viewableItems = []
      visibleItemsWithoutCategoryFilter = this.getVisibleItemsWithoutCategoryFilter()
      viewableItems = this.getViewableItems(visibleItemsWithoutCategoryFilter)

      const {category, category_title, category_unique_field} = getCategorySettings(page_type, subreddit)

      const selections =
      <Selections subreddit={subreddit}
                  page_type={page_type}
                  visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                  num_showing={viewableItems.length}
                  num_items={items.length}
                  category_type={category} category_title={category_title}
                  category_unique_field={category_unique_field}/>

      return (
        <React.Fragment>
          <WrappedComponent {...this.props} {...this.state} selections={selections}
            viewableItems={viewableItems} visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}/>
        </React.Fragment>
      )
    }
  }
