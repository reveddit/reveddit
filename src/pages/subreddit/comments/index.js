import React from 'react'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'
import { connect, localSort_types } from 'state'
import Time from 'pages/common/Time'
import Comment from 'pages/common/Comment'
import Selections from 'pages/common/selections'
import ResultsSummary from 'pages/common/ResultsSummary'
import { REMOVAL_META, NOT_REMOVED, USER_REMOVED } from 'pages/common/RemovedBy'
import { withFetch } from 'pages/RevdditFetcher'

const byScore = (a, b) => {
  return (b.score - a.score)
}
const byDate = (a, b) => {
  return (b.created_utc - a.created_utc)
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
    const { page_type, viewableItems, selections } = this.props
    const {items, loading, localSort, localSortReverse} = this.props.global.state
    const noItemsFound = items.length === 0 && ! loading

    const items_sorted = viewableItems


    if (localSort === localSort_types.date) {
      items_sorted.sort( byDate )
    } else if (localSort === localSort_types.score) {
      items_sorted.sort( byScore )
    } else if (localSort === localSort_types.controversiality1) {
      items_sorted.sort( byControversiality1 )
    } else if (localSort === localSort_types.controversiality2) {
      items_sorted.sort( byCommentLength )
    } else if (localSort === localSort_types.comment_length) {
      items_sorted.sort( byCommentLength )
    }
    if (localSortReverse) {
      items_sorted.reverse()
    }
    return (
      <React.Fragment>
        {selections}
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
      </React.Fragment>
    )
  }
}

export default connect(withFetch(SubredditComments))
