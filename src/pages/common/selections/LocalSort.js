import React from 'react'
import { connect, localSort_types, getPageType } from 'state'
import { Selection } from './SelectionBase'
import { Help } from 'components/Misc'
import { showAccountInfo_global } from 'pages/modals/Settings'

const paramKey_sortType = 'localSort'
const paramKey_reverse = 'localSortReverse'
const sortby_help = <Help title='Sort by' content={<>
  <p>Sorting by account age and karma is only available when <code>show account age/karma</code> is selected in settings (⚙). Reload the page after setting to start showing account data and sorting by it.</p>
  <p>The account age shown next to an author name is the account's age at the time the post was created.</p>
  <p>The account karma shown after the | is the account's karma for that type of content, posts or comments.</p>
</>}/>

const LocalSort = connect(({global, page_type}) => {
  const {localSort, localSortReverse, showContext, limitCommentDepth} = global.state
  const updateStateAndURL = global.selection_update
  page_type = getPageType(page_type)
  const makeLabel = (value, text, disabled) => {
    return (
      <label>
        <input type='radio' value={localSort_types[value]}
          checked={localSort === localSort_types[value]}
          onChange={(e) => updateStateAndURL('localSort', e.target.value, page_type )}
          disabled={disabled}
        />
        <span>{text}</span>
      </label>
    )
  }

  const makeCheckbox = (name, id, text, value) => {
    return <label id={id}>
      <input type='checkbox'
        checked={value}
        onChange={(e) => updateStateAndURL(name, e.target.checked, page_type)}
      />
      <span>{text}</span>
    </label>
  }
  const accountInfoNotYetRetrieved = ! showAccountInfo_global && ! global.accountFilterOrSortIsSet()
  return (
      <Selection className='localSort' title='Sort By' isSort={true} titleHelpModal={{content: sortby_help}}>
        {['thread', 'subreddit_comments'].includes(page_type) ?
          <React.Fragment>
            {makeLabel('controversiality1', 'controversiality v1')}
            {makeLabel('controversiality2', 'controversiality v2')}
          </React.Fragment>
        :
          makeLabel('controversiality', 'controversiality')
        }
        {['thread', 'subreddit_posts', 'domain_posts', 'info', 'search',
          'duplicate_posts', 'subreddit_comments', 'missing_comments'].includes(page_type) &&
          makeLabel('num_comments', 'number of comments')}
        {['thread', 'subreddit_comments', 'missing_comments'].includes(page_type) &&
          makeLabel('comment_length', 'comment length')}

        {makeLabel('score', 'score (top)')}
        {makeLabel('date', 'date (new)')}
        {page_type === 'missing_comments' &&
          makeLabel('date_observed', 'date observed')}
        {['subreddit_posts', 'domain_posts', 'info', 'search', 'duplicate_posts'].includes(page_type) &&
          makeLabel('num_crossposts', 'number of crossposts')}
        {['search'].includes(page_type) &&
          makeLabel('num_replies', 'number of replies')}
        {['search', 'info', 'domain_posts', 'duplicate_posts', 'missing_comments'].includes(page_type) &&
          makeLabel('subreddit_subscribers', 'subreddit subscribers')}
        {makeLabel('account_age', 'account age (new)', accountInfoNotYetRetrieved)}
        {makeLabel('account_combined_karma', 'account karma', accountInfoNotYetRetrieved)}
        <label id='reverseSort'>
          <input type='checkbox'
            checked={localSortReverse}
            onChange={(e) => updateStateAndURL('localSortReverse', e.target.checked, page_type)}
          />
          <span>reverse</span>
        </label>
        { ['thread'].includes(page_type) &&
          <>
            {makeCheckbox('showContext', 'context', 'context', showContext)}
            {makeCheckbox('limitCommentDepth', 'limitCommentDepth', 'limit comment depth', limitCommentDepth)}
          </>
        }
      </Selection>
  )
})


export default LocalSort
