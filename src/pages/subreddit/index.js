import React, {useState, useEffect} from 'react'
import { Link } from 'react-router-dom'
import Post from 'pages/common/Post'
import { withFetch } from 'pages/RevdditFetcher'
import { connect, localSort_types } from 'state'
import { reversible, getUrlWithTimestamp, copyLink, PATH_STR_USER,
         PATH_STR_SUB,
} from 'utils'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'
import Notice from 'pages/common/Notice'

const SubredditPosts = (props) => {
  const { subreddit } = props.match.params
  const { page_type, viewableItems, selections, summary, archiveDelayMsg,
          oldestTimestamp, newestTimestamp, global,
        } = props
  const {items, loading, localSort,
         hasVisitedUserPage, hasVisitedTopRemovedPage,
        } = global.state
  const noItemsFound = items.length === 0 && ! loading
  const pagination = <Pagination oldestTimestamp={oldestTimestamp} newestTimestamp={newestTimestamp}
                                 bottom={true} subreddit={subreddit}/>
  let instructionalNotice = ''
  if (! hasVisitedUserPage) {
    instructionalNotice =
      <Notice className='userpage-note' message={
        <>
          Check if you have any removed comments.
        </>
      } htmlLink={<Link to={PATH_STR_USER+'/'}>view my removed comments</Link>}
      />
  } else if (! hasVisitedTopRemovedPage) {
    instructionalNotice =
      <Notice className='top-removed-note' message={
        <>
          Check the archive for top removed content.
        </>
      } htmlLink={<a href={PATH_STR_SUB+`/${subreddit}/top/`}>show top removed content</a>}
      />
  }
  return (
    <React.Fragment>
      <div className="revddit-sharing">
        <a href={getUrlWithTimestamp()} onClick={copyLink}>copy sharelink</a>
      </div>
      {selections}
      {summary}
      {instructionalNotice}
      <Highlight/>
      {archiveDelayMsg}
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
