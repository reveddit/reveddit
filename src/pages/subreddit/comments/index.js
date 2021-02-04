import React from 'react'
import { Link } from 'react-router-dom'
import { connect, localSort_types, create_qparams } from 'state'
import Time from 'pages/common/Time'
import Comment from 'pages/common/Comment'
import Selections from 'pages/common/selections'
import ResultsSummary from 'pages/common/ResultsSummary'
import { REMOVAL_META, NOT_REMOVED, USER_REMOVED } from 'pages/common/RemovedBy'
import { withFetch } from 'pages/RevdditFetcher'
import { reversible, getUrlWithTimestamp, copyLink, PATH_STR_USER } from 'utils'
import Highlight from 'pages/common/Highlight'
import Pagination from 'components/Pagination'

const SubredditComments = (props) => {
  const { subreddit } = props.match.params
  const { page_type, viewableItems, selections, summary,
          notShownMsg, archiveDelayMsg, global,
        } = props
  const {items, loading, localSort, hasVisitedUserPage,
         paginationMeta, oldestTimestamp, newestTimestamp,
        } = global.state
  const noItemsFound = items.length === 0 && ! loading

  const pagination = <Pagination oldestTimestamp={oldestTimestamp} newestTimestamp={newestTimestamp}
                                 paginationMeta={paginationMeta} bottom={true} subreddit={subreddit}/>

  return (
    <React.Fragment>
      <div className="revddit-sharing">
        <a href={getUrlWithTimestamp()} onClick={copyLink}>copy sharelink</a>
      </div>
      {selections}
      {summary}
      {! hasVisitedUserPage &&
        <div className='notice-with-link userpage-note'>
          <div>{"Check if you have any removed comments."}</div>
          <Link to={PATH_STR_USER+'/'}>view my removed comments</Link>
        </div>
      }
      <Highlight/>
      {archiveDelayMsg}
      {notShownMsg}
      {
        noItemsFound ?
        <p>No comments found</p> :
        viewableItems.map(item => {
          return <Comment
            key={item.id}
            {...item}
            depth={0}
            page_type={page_type}
          />
        })
      }
      {pagination}
    </React.Fragment>
  )
}

export default connect(withFetch(SubredditComments))
