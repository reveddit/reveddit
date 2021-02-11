import React from 'react'
import { connect, adjust_qparams_for_selection } from 'state'
import { Selection } from './SelectionBase'
import { SimpleURLSearchParams, truthyOrUndefined } from 'utils'
import { pageTypes } from 'pages/DefaultLayout'
import { NewWindowLink } from 'components/Misc'

const SELECTED_CLASS = 'selected'

const ContentLink = connect(({expected_suffix, description,
                      global, page_type,
                      param_name, expected_param_value}) => {
  const path_parts = window.location.pathname.split('/')
  const suffix = path_parts.slice(3,4)[0] || ''
  const link_path_parts = path_parts.slice(0,3)
  link_path_parts.push(expected_suffix)
  const path = link_path_parts.join('/').replace(/\/$/,'')+'/'
  let selected = ''
  let params = ''
  if (param_name) {
    const queryParams = new SimpleURLSearchParams()
    adjust_qparams_for_selection(page_type, queryParams, param_name, expected_param_value)
    params = queryParams.toString()
  }
  if (suffix === expected_suffix) {
    if (param_name) {
      if (global.state[param_name] === expected_param_value) {
        selected = SELECTED_CLASS
      }
    } else {
      selected = SELECTED_CLASS
    }
  }
  return (
    <div>
      <a className={selected} href={path+params}>
        {description}
      </a>
    </div>
  )
})
const from = 'from this subreddit'
const out = 'May be several months out of date.'
const un = 'r/undelete'
const pushshift = <>This page is up to date according to the status shown on <a href='/info/'>/info</a>.</>

const content_help =
  <>
    <h3>posts</h3>
    <p>Recent posts {from}. {pushshift}</p>
    <h3>comments</h3>
    <p>Recent comments {from}. {pushshift}</p>
    <h3>top posts</h3>
    <p>Archived highly upvoted removed posts {from}. {out}</p>
    <h3>top comments</h3>
    <p>Archived highly upvoted removed comments {from}. {out}</p>
    <h3>r/all posts</h3>
    <p>Archived removed posts that had hit r/all {from}. This page is up to date if the <NewWindowLink reddit={`/${un}`}>{un}</NewWindowLink> bot is running.</p>
    <h3>lost comments</h3>
    <p>Comments {from} that do not appear in the thread unless directly linked. <NewWindowLink reddit='/gwzbxp'>more info</NewWindowLink></p>
  </>

const Content = ({global, subreddit, page_type}) => {
  return (
    <Selection className='content' title='Content' titleHelpModal={{content: content_help}}>
      {page_type === 'user' &&
        <>
          <ContentLink expected_suffix='' description='comments and posts'/>
          <ContentLink expected_suffix='comments' description='comments'/>
          <ContentLink expected_suffix='submitted' description='posts'/>
          <ContentLink expected_suffix='gilded' description='gilded'/>
        </>
      }
      {[pageTypes.subreddit_posts, pageTypes.subreddit_comments, pageTypes.aggregations, pageTypes.missing_comments].includes(page_type) &&
        <>
          <ContentLink expected_suffix='' description='posts'
            param_name='frontPage' expected_param_value={false}
            page_type={pageTypes.subreddit_posts}/>
          <ContentLink expected_suffix='comments' description='comments'/>
          {subreddit !== 'all' && ! truthyOrUndefined(global.state.over18) &&
            <>
              <ContentLink expected_suffix='top' description='top comments'
                           param_name='content'  expected_param_value='comments' page_type={pageTypes.aggregations}/>
              <ContentLink expected_suffix='top' description='top posts'
                           param_name='content'  expected_param_value='posts' page_type={pageTypes.aggregations}/>
            </>
          }
          {subreddit !== 'all' &&
            <>
              <ContentLink expected_suffix='' description='r/all posts'
                           param_name='frontPage' expected_param_value={true} page_type={pageTypes.subreddit_posts}/>
            </>
          }
          <ContentLink expected_suffix='missing-comments' description='lost comments'/>
        </>
      }
    </Selection>
  )
}

export default connect(Content)
