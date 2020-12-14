import React from 'react'
import { connect, urlParamKeys } from 'state'
import { Selection } from './SelectionBase'

const SELECTED_CLASS = 'selected'

const ContentLink = connect(({expected_suffix, description,
                      global,
                      param_name, expected_param_value,
                      include_param_in_link = true}) => {
  const path_parts = window.location.pathname.split('/')
  const suffix = path_parts.slice(3,4)[0] || ''
  const link_path_parts = path_parts.slice(0,3)
  link_path_parts.push(expected_suffix)
  const path = link_path_parts.join('/').replace(/\/$/,'')+'/'
  let selected = ''
  let params = ''
  if (param_name && include_param_in_link) {
    params = `?${urlParamKeys[param_name]}=${expected_param_value}`
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

const Content = ({subreddit, page_type}) => {
  return (
    <Selection className='content' title='Content'>
      {page_type === 'user' &&
        <>
          <ContentLink expected_suffix='' description='comments and posts'/>
          <ContentLink expected_suffix='comments' description='comments'/>
          <ContentLink expected_suffix='submitted' description='posts'/>
          <ContentLink expected_suffix='gilded' description='gilded'/>
        </>
      }
      {['subreddit_posts', 'subreddit_comments', 'aggregations'].includes(page_type) &&
        <>
          <ContentLink expected_suffix='' description='posts'
            param_name='frontPage' expected_param_value={false}
            include_param_in_link={false} />
          <ContentLink expected_suffix='comments' description='comments'/>
          {subreddit !== 'all' &&
            <>
              <ContentLink expected_suffix='top' description='top comments'
                           param_name='content'  expected_param_value='comments'/>
              <ContentLink expected_suffix='top' description='top posts'
                           param_name='content'  expected_param_value='posts'/>
            </>
          }
          {subreddit !== 'all' &&
            <>
              <ContentLink expected_suffix='' description='r/all posts'
                           param_name='frontPage' expected_param_value={true}/>
            </>
          }
        </>
      }
    </Selection>
  )
}

export default connect(Content)
