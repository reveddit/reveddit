import React, { Suspense, lazy } from 'react'
import {connect} from 'state'
import RemovedFilter from 'pages/common/selections/RemovedFilter'
import RemovedByFilter from 'pages/common/selections/RemovedByFilter'
import CategoryFilter from 'pages/common/selections/CategoryFilter'
import LocalSort from 'pages/common/selections/LocalSort'
import RedditSort from 'pages/common/selections/RedditSort'
import Content from 'pages/common/selections/Content'
import TextFilter from 'pages/common/selections/TextFilter'
import TagsFilter from 'pages/common/selections/TagsFilter'
import ResultsSummary from 'pages/common/ResultsSummary'
import Selfposts from 'pages/common/selections/Selfposts'
import { SimpleURLSearchParams } from 'utils'
import ErrorBoundary from 'components/ErrorBoundary'

import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'

const UpvoteRemovalRateHistory = lazy(() => import('pages/common/selections/UpvoteRemovalRateHistory'))

const paramKey = 'showFilters'

// disable preflight request, which can't be cached by cloudflare, by using customFetch
const customFetch = (uri, options) => {
  const fetchOptions = {
    credentials: 'same-origin',
    method: "GET",
    headers: {
      accept: '*/*'
    },
    signal: options.signal
  }
  return fetch(decodeURI(uri), fetchOptions)
}

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: REVEDDIT_GRAPHQL_HOST + 'graphql-get/',
    fetch: customFetch,
    useGETForQueries: true
  }),
})

class Selections extends React.Component {
  state = {
    showFilters: false
  }

  componentDidMount () {
    const queryParams = new SimpleURLSearchParams(window.location.search)
    if (queryParams.get(paramKey) === 'true') {
      this.setState({showFilters: true})
    }
  }
  toggleShowFilters = () => {
    const showFilters = ! this.state.showFilters
    const queryParams = new SimpleURLSearchParams(window.location.search)
    if (showFilters) {
      queryParams.set(paramKey, true)
    } else {
      queryParams.delete(paramKey)
    }
    let to = `${window.location.pathname}${queryParams.toString()}`
    window.history.replaceState(null,null,to)
    this.setState({showFilters})
  }
  getShowFiltersText() {
    if (this.state.showFilters) {
      return '[–] hide filters'
    } else {
      return '[+] show filters'
    }
  }
  render () {
    const { subreddit, page_type, visibleItemsWithoutCategoryFilter, num_items, num_showing,
            category_type, category_title, category_unique_field } = this.props
    const { showFilters } = this.state
    let upvoteRemovalRateHistory = ''
    if (['subreddit_posts', 'subreddit_comments', 'thread'].includes(page_type)) {
      upvoteRemovalRateHistory = (
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <ApolloProvider client={apolloClient}>
              <UpvoteRemovalRateHistory subreddit={subreddit} page_type={page_type}/>
            </ApolloProvider>
          </Suspense>
        </ErrorBoundary> )
    }
    const categoryFilter = <CategoryFilter page_type={page_type}
      visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
      type={category_type} title={category_title} unique_field={category_unique_field}/>
    return (
      <React.Fragment>
        <div className='toggleFilters'><a onClick={this.toggleShowFilters}
                className='collapseToggle'>
                {this.getShowFiltersText()}</a>
            {showFilters && <> | <a className='pointer' onClick={() => this.props.global.saveDefaults(page_type)}>save</a>
            &nbsp;/ <a className='pointer' onClick={() => this.props.global.resetDefaults(page_type)}>reset</a></>}
        </div>
        <div style={{clear:'both'}}></div>
        {showFilters &&
          <div className='selections'>
            {(() => {
              switch(page_type) {
                case 'subreddit_posts':
                case 'domain_posts':
                case 'duplicate_posts':
                case 'info':
                case 'search':
                  return (
                    <React.Fragment>
                      {page_type === 'subreddit_posts' &&
                        <Content page_type={page_type}/>
                      }
                      {page_type === 'domain_posts' &&
                        <Selfposts page_type={page_type}/>
                      }
                      <LocalSort page_type={page_type}/>
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type}/>
                      <TagsFilter page_type={page_type}/>
                      {categoryFilter}
                      {subreddit !== 'all' && page_type === 'subreddit_posts' &&
                        upvoteRemovalRateHistory
                      }
                      <TextFilter page_type={page_type} />
                    </React.Fragment>)
                case 'subreddit_comments':
                case 'missing_comments':
                  return (
                    <React.Fragment>
                      {page_type === 'subreddit_comments' &&
                        <Content page_type={page_type}/>
                      }
                      <LocalSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type} />
                      <TagsFilter page_type={page_type}/>
                      {categoryFilter}
                      {subreddit !== 'all' &&
                        upvoteRemovalRateHistory
                      }
                      <TextFilter page_type={page_type} />
                    </React.Fragment>)
                case 'user':
                  return (
                    <React.Fragment>
                      <Content page_type={page_type} />
                      <RedditSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type}/>
                      <TagsFilter page_type={page_type}/>
                      {categoryFilter}
                      <TextFilter page_type={page_type} />
                    </React.Fragment>)
                case 'thread':
                  return (
                    <React.Fragment>
                      <LocalSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type} />
                      <TagsFilter page_type={page_type}/>
                      {subreddit !== 'all' &&
                        upvoteRemovalRateHistory
                      }
                    </React.Fragment>)
                default: return ''
              }
            })()}
          </div>
        }
        {num_items ?
          <ResultsSummary num_showing={num_showing}
                          category_type={category_type}
                          category_unique_field={category_unique_field}
                          page_type={page_type} />
                          : ''
        }
      </React.Fragment>
    )
  }
}

export default connect(Selections)
