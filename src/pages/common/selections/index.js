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
import {www_reddit} from 'api/reddit'
import { QuestionMarkModal, Help } from 'components/Misc'

const UpvoteRemovalRateHistory = lazy(() => import('pages/common/selections/UpvoteRemovalRateHistory'))

const paramKey = 'showFilters'

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
    <p><a target='_blank' href={www_reddit+'/jh52dn'}>more info</a></p>
  </>
)


const word_help = <Help title='Title/Body filter' content={word_filter_help}/>
const flair_help = <Help title='Flair filter' content={word_filter_help}/>
const url_help = <Help title='URL filter' content={word_filter_help}/>

const as_of_help = <Help title='As of' content={<>
  <p>Shows comments as of a certain time stamp. To set the timestamp, click the <b>as of</b> link beneath a comment.</p>
</>}/>

const Selections = ({subreddit, page_type, visibleItemsWithoutCategoryFilter,
                     category_type, category_title, category_unique_field, global,
                   }) => {
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const queryParams = new SimpleURLSearchParams(window.location.search)
    if (queryParams.get(paramKey) === 'true') {
      setShowFilters(true)
    }
  }, [])

  const toggleShowFilters = () => {
    const oppositeShowFilters = ! showFilters
    const queryParams = new SimpleURLSearchParams(window.location.search)
    if (oppositeShowFilters) {
      queryParams.set(paramKey, true)
    } else {
      queryParams.delete(paramKey)
    }
    updateURL(queryParams)
    setShowFilters(oppositeShowFilters)
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
    type={category_type} title={category_title} unique_field={category_unique_field}/>
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
                    <RedditSortTimeBase page_type={page_type} globalVarName='t' className='redditTime' title='From'/>
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
                    <Content page_type={page_type} subreddit={subreddit}/>
                    <div>
                      <RedditSortTimeBase page_type={page_type} globalVarName='sort' className='aggSort' title='Sort By'/>
                      <ItemsPerPage/>
                    </div>
                    {textFilter_content}
                    {upvoteRemovalRateHistory}
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
