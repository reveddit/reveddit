import React from 'react'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import { withFetch } from 'pages/RevdditFetcher'
import { connect, localSort_types } from 'state'
import { reversible, getUrlWithTimestamp, PATH_STR_USER,
         PATH_STR_SUB,
} from 'utils'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'
import {TipWithBackground, UserPageTip} from 'pages/common/Notice'
import { ShareLink } from 'components/Misc'

const SubredditPosts = (props) => {
  const { subreddit } = props.match.params
  const { page_type, viewableItems, selections, summary, topNotice,
          global,
        } = props
  const {items, loading, localSort,
         hasVisitedUserPage, hasVisitedTopRemovedPage,
        } = global.state
  const noItemsFound = items.length === 0 && ! loading
  const pagination = <Pagination {...{page_type}} bottom={true} subreddit={subreddit}/>
  let instructionalNotice = ''
  if (! hasVisitedUserPage) {
    instructionalNotice =
      <UserPageTip/>
  } else if (! hasVisitedTopRemovedPage) {
    instructionalNotice =
      <TipWithBackground className='top-removed-note' message={
        <>
          Check the archive for top removed content.
        </>
      } htmlLink={<a href={PATH_STR_SUB+`/${subreddit}/history/`}>show top removed content</a>}
      />
  }
  return (
    <React.Fragment>
      <ShareLink href={getUrlWithTimestamp()} useHref={false}/>
      {selections}
      {summary}
      {instructionalNotice}
      <Highlight/>
      {topNotice}
      {
        noItemsFound ?
        <p>No posts found</p> :
        viewableItems.map(item => {
          return <Post key={item.id} {...item} page_type={page_type}/>
        })
      }
      {pagination}
    </React.Fragment>
  )
}

export default connect(withFetch(SubredditPosts))
