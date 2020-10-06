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
import {byNumComments} from 'data_processing/info'
import Pagination from 'components/Pagination'

const byScore = (a, b) => {
  return (b.score - a.score)
}
const byDate = (a, b) => {
  return (b.created_utc - a.created_utc)
}
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

class SubredditComments extends React.Component {
  render () {
    const { subreddit } = this.props.match.params
    const { page_type, viewableItems, selections, notShownMsg, archiveDelayMsg,
          } = this.props
    const {items, loading, localSort, localSortReverse, hasVisitedUserPage,
           paginationMeta, oldestTimestamp, newestTimestamp,
          } = this.props.global.state
    const noItemsFound = items.length === 0 && ! loading
    const items_sorted = viewableItems
    if (localSort === localSort_types.date) {
      items_sorted.sort( reversible(byDate, localSortReverse) )
    } else if (localSort === localSort_types.date_observed) {
      items_sorted.sort( reversible(byDateObserved, localSortReverse) )
    } else if (localSort === localSort_types.score) {
      items_sorted.sort( reversible(byScore, localSortReverse) )
    } else if (localSort === localSort_types.controversiality1) {
      items_sorted.sort( reversible(byControversiality1, localSortReverse) )
    } else if (localSort === localSort_types.controversiality2) {
      items_sorted.sort( reversible(byControversiality2, localSortReverse) )
    } else if (localSort === localSort_types.comment_length) {
      items_sorted.sort( reversible(byCommentLength, localSortReverse) )
    } else if (localSort === localSort_types.num_comments) {
      items_sorted.sort( reversible(byNumComments, localSortReverse) )
    }
    const pagination = <Pagination oldestTimestamp={oldestTimestamp} newestTimestamp={newestTimestamp}
                                   paginationMeta={paginationMeta} bottom={true} subreddit={subreddit}/>

    return (
      <React.Fragment>
        <div className="revddit-sharing">
          <a href={getUrlWithTimestamp()} onClick={copyLink}>copy sharelink</a>
        </div>
        {selections}
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
          items_sorted.map(item => {
            return <Comment
              key={item.id}
              {...item}
              depth={0}
            />
          })
        }
        {pagination}
      </React.Fragment>
    )
  }
}

export default connect(withFetch(SubredditComments))
