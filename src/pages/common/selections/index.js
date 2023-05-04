import React, { Suspense, lazy, useState, useEffect } from 'react'
import ErrorBoundary from 'components/ErrorBoundary'
import {connect, updateURL} from 'state'
import RemovedFilter from './RemovedFilter'
import RemovedByFilter from './RemovedByFilter'
import CategoryFilter from './CategoryFilter'
import LocalSort from './LocalSort'
import ItemsPerPage from './ItemsPerPage'
import RedditSortTimeBase from './RedditSortTimeBase'
import Content from './Content'
import TextFilter from './TextFilter'
import {FlairFilter} from './TextFilter'
import MinMaxFilters from './MinMaxFilters'
import TagsFilter from './TagsFilter'
import Selfposts from './Selfposts'
import { SimpleURLSearchParams } from 'utils'
import { NewWindowLink } from 'components/Misc'
import { QuestionMarkModal, Help } from 'components/Misc'
import BeforeAfter from './BeforeAfter'

const UpvoteRemovalRateHistory = lazy(() => import('pages/common/selections/UpvoteRemovalRateHistory'))

const showFiltersParamKey = 'showFilters'

const word_filter_help = (
  <>
    <p>Matches content containing ALL keywords, case insensitive.</p>
    <p>To negate, prefix the word with - (minus sign).</p>
    <p>Phrase search "using quotes". Phrases are treated as javascript regular expressions. Examples,</p>
    <ul>
      <li>fox trot -delta</li>
      <li>"find this phrase" -"not this one" (phrase)</li>
      <li>".": match anything (regex)</li>
      <li>"this|that": match EITHER this OR that (regex)</li>
    </ul>
    <p><NewWindowLink reddit={'/jh52dn'}>more info</NewWindowLink></p>
  </>
)

const word_help = <Help title='Title/Body filter' content={word_filter_help}/>
const flair_help = <Help title='Flair filter' content={word_filter_help}/>
const url_help = <Help title='URL filter' content={word_filter_help}/>
const as_of_help = <Help title='As of' content={<>
  <p>Shows comments as of a certain time stamp. To set the timestamp, click the <b>as of</b> link beneath a comment.</p>
</>}/>
const from_help = <Help title='From filter' content={<>
  <p>The from filter is only available when <b>Sort by</b> is 'top' or 'controversial'.</p>
</>
}/>
const beforeAfter_help = <Help title='Date filter' content={<>
  <p>Jumps to a point in time such as <b>before 2020-1-1</b>. Or, <b>before 1 day ago</b> shows the most recent items created before exactly 24 hours ago. Any <NewWindowLink href='/info/'>archive delay</NewWindowLink> may impact results.</p>
  <p>Select timestamp to use an epoch timestamp.</p>
</>
}/>

const Selections = ({subreddit, page_type, visibleItemsWithoutCategoryFilter,
                     category_type, category_title, category_unique_field, global,
                     filterDependencies,
                   }) => {
  const [showFiltersMeta, setShowFiltersMeta] = useState({
    showFilters: false,
    filtersHaveBeenShown: false,
  })

  useEffect(() => {
    const queryParams = new SimpleURLSearchParams(window.location.search)
    const paramValue = queryParams.get(showFiltersParamKey)
    if (paramValue === 'true' || (paramValue !== 'false' && page_type === 'aggregations')) {
      setShowFiltersMeta({showFilters: true, filtersHaveBeenShown: true})
      if (! paramValue) {
        queryParams.set(showFiltersParamKey, 'true')
        updateURL(queryParams)
      }
    }
  }, [])
  const {showFilters, filtersHaveBeenShown} = showFiltersMeta
  const toggleShowFilters = () => {
    const newShowFiltersMeta = {
      showFilters: ! showFilters,
      filtersHaveBeenShown,
    }
    const queryParams = new SimpleURLSearchParams(window.location.search)
    if (newShowFiltersMeta.showFilters) {
      newShowFiltersMeta.filtersHaveBeenShown = true
      queryParams.set(showFiltersParamKey, true)
    } else {
      queryParams.delete(showFiltersParamKey)
    }
    updateURL(queryParams)
    setShowFiltersMeta(newShowFiltersMeta)
  }
  const showFiltersText = showFilters ? '[–] hide filters' : '[+] show filters'
  let upvoteRemovalRateHistory = '', save_reset_buttons = ''
  if (['subreddit_posts', 'subreddit_comments', 'thread', 'aggregations'].includes(page_type) && subreddit !== 'all') {
    upvoteRemovalRateHistory = (
      <ErrorBoundary>
        <Suspense fallback={<></>}>
          <UpvoteRemovalRateHistory subreddit={subreddit} page_type={page_type}/>
        </Suspense>
      </ErrorBoundary>)
  }
  const minMaxFilters = <MinMaxFilters page_type={page_type}/>

  const categoryFilter = <CategoryFilter page_type={page_type}
    visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
    type={category_type} title={category_title} unique_field={category_unique_field}
    filterDependencies={filterDependencies}
  />
  const textFilter_content_title = page_type === 'thread' ? 'Body' : 'Title/Body'
  const textFilter_content =
    <TextFilter page_type={page_type} globalVarName='keywords' placeholder='keywords' key='kw'
                title={textFilter_content_title} titleHelpModal={{content:word_help}} />
  const flairFilter_user =
  <FlairFilter page_type={page_type} globalVarName='user_flair' placeholder='user flair' key='uf'
               title='User Flair' titleHelpModal={{content:flair_help}} />
  const textFilters = [
    textFilter_content,
    <FlairFilter page_type={page_type} globalVarName='post_flair' placeholder='post flair' key='pf'
                 title='Post Flair' titleHelpModal={{content:flair_help}} />,
    flairFilter_user,
    <TextFilter page_type={page_type} globalVarName='filter_url' placeholder='url' key='url'
                title='URL' titleHelpModal={{content:url_help}} />,
  ]
  const beforeAfter = <BeforeAfter page_type={page_type}
                       title='Date' titleHelpModal={{content:beforeAfter_help}} />
  if (showFilters) {
    const save_reset_help = <Help title='Save/Reset' content={
      <>
        <p>Save: Saves the currently selected filters as the default on page loads for the current page type, [{page_type}]</p>
        <p>Reset: Resets saved custom filters to the default values.</p>
        <p><span className="quarantined">Tip</span> To show all items on a page, click the link on the number of items shown, for example "4 of 100"</p>
      </>
    }/>
    const save = <a className='pointer' onClick={() => global.saveDefaults(page_type)}>save</a>
    const reset = <a className='pointer' onClick={() => global.resetDefaults(page_type)}>reset</a>
    save_reset_buttons = <span> | {save} / {reset}<QuestionMarkModal modalContent={{content:save_reset_help}}/></span>
  }

  return (
    <>
      <div className='toggleFilters'>
        <a onClick={toggleShowFilters} className='collapseToggle'>{showFiltersText}</a>
        {save_reset_buttons}
      </div>
      <div style={{clear:'both'}}></div>
      {filtersHaveBeenShown &&
        <div className='selections' style={showFilters ? null : {display:'none'}}>
          {(() => {
            switch(page_type) {
              case 'subreddit_posts':
              case 'domain_posts':
              case 'duplicate_posts':
              case 'info':
              case 'search':
                return (
                  <>
                    {page_type === 'subreddit_posts' &&
                      <Content page_type={page_type} subreddit={subreddit}/>
                    }
                    {page_type === 'domain_posts' &&
                      <Selfposts page_type={page_type}/>
                    }
                    <LocalSort page_type={page_type}/>
                    <div>
                      <RemovedFilter page_type={page_type} />
                      <ItemsPerPage/>
                      {! ['duplicate_posts', 'info'].includes(page_type) && beforeAfter}
                    </div>
                    <RemovedByFilter page_type={page_type}/>
                    <div>
                      <TagsFilter page_type={page_type}/>
                      {minMaxFilters}
                    </div>
                    <div>{textFilters}</div>
                    <div>
                      {categoryFilter}
                      {upvoteRemovalRateHistory}
                    </div>
                  </>)
              case 'subreddit_comments':
              case 'missing_comments':
                return (
                  <>
                    <Content page_type={page_type} subreddit={subreddit}/>
                    <LocalSort page_type={page_type}/>
                    <div>
                      <RemovedFilter page_type={page_type} />
                      <ItemsPerPage/>
                      {page_type !== 'missing_comments' && beforeAfter}
                    </div>
                    <RemovedByFilter page_type={page_type} />
                    <div>
                      <TagsFilter page_type={page_type}/>
                      {minMaxFilters}
                    </div>
                    <div>{textFilters}</div>
                    <div>
                      {categoryFilter}
                      {upvoteRemovalRateHistory}
                    </div>
                  </>)
              case 'user':
                return (
                  <>
                    <Content page_type={page_type} />
                    <RedditSortTimeBase page_type={page_type} globalVarName='sort' className='redditSort' title='Sort By'/>
                    <RedditSortTimeBase page_type={page_type} globalVarName='t' className='redditTime' title='From' titleHelpModal={{content: from_help}}/>
                    <div>
                      <RemovedFilter page_type={page_type} />
                      {categoryFilter}
                    </div>
                    <RemovedByFilter page_type={page_type}/>
                    <div>
                      <TagsFilter page_type={page_type}/>
                      {minMaxFilters}
                    </div>
                    <div>{textFilters}</div>
                  </>)
              case 'thread':
                return (
                  <>
                    <LocalSort page_type={page_type} />
                    <RemovedFilter page_type={page_type} />
                    <RemovedByFilter page_type={page_type} />
                    <div>
                      {categoryFilter}
                      {textFilter_content}
                      {flairFilter_user}
                    </div>
                    <div>
                      <TagsFilter page_type={page_type}/>
                      <TextFilter page_type={page_type} globalVarName='thread_before' placeholder='UTC timestamp'
                                  title={'As of'} titleHelpModal={{content:as_of_help}} />
                    </div>
                    {upvoteRemovalRateHistory}
                  </>)
              case 'aggregations':
                return (
                  <>
                    {upvoteRemovalRateHistory}
                    <div>
                      <RedditSortTimeBase page_type={page_type} globalVarName='sort' className='aggSort' title='Sort By'/>
                      <ItemsPerPage/>
                    </div>
                    <div>
                       <BeforeAfter page_type={page_type} before_or_after='after'
                          title='After' titleHelpModal={{content:beforeAfter_help}} />
                       <BeforeAfter page_type={page_type} before_or_after='before'
                          title='Before' titleHelpModal={{content:beforeAfter_help}} />
                    </div>
                    <Content page_type={page_type} subreddit={subreddit}/>
                    {textFilter_content}
                  </>)
              default: return ''
            }
          })()}
        </div>
      }
    </>
  )
}

export default connect(Selections)
