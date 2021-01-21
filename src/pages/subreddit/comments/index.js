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
import {byScore, byDate, byNumComments, bySubredditSubscribers} from 'data_processing/info'
import {useSort} from 'hooks/sort'

const byDateObserved = (a, b) => {
  return (b.observed_utc - a.observed_utc)
}
const byCommentLength = (a, b) => {
  return (b.body.length - a.body.length) || (b.score - a.score) || (b.created_utc - a.created_utc)
}
const byControversiality1 = (a, b) => {
  let a_score_noneg = a.score < 0 ? 0 : a.score
  let b_score_noneg = b.score < 0 ? 0 : b.score
  return (a_score_noneg - b_score_noneg)
}
const byControversiality2 = (a, b) => {
  let a_score_abs = Math.abs(a.score)
  let b_score_abs = Math.abs(b.score)
  return (b.controversiality - a.controversiality) || (a_score_abs - b_score_abs)
}
const sortFnMap = {
  [localSort_types.date]: byDate,
  [localSort_types.date_observed]: byDateObserved,
  [localSort_types.score]: byScore,
  [localSort_types.controversiality1]: byControversiality1,
  [localSort_types.controversiality2]: byControversiality2,
  [localSort_types.comment_length]: byCommentLength,
  [localSort_types.num_comments]: byNumComments,
  [localSort_types.subreddit_subscribers]: bySubredditSubscribers,
}

const SubredditComments = (props) => {
  const { subreddit } = props.match.params
  const { page_type, viewableItems, selections, summary,
          notShownMsg, archiveDelayMsg, global,
        } = props
  const {items, loading, localSort, hasVisitedUserPage,
         paginationMeta, oldestTimestamp, newestTimestamp,
        } = global.state
  const noItemsFound = items.length === 0 && ! loading
  useSort(global, viewableItems, sortFnMap[localSort])

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
