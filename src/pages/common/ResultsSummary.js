import React from 'react'
import { getPrettyTimeLength } from 'utils'
import Time from 'pages/common/Time'
import { connect } from 'state'

class ResultsSummary extends React.Component {
  render() {
    const {allItems, visibleItems, page_type,
           category_type, category_unique_field} = this.props
    const gs = this.props.global.state
    const category_state = gs['categoryFilter_'+category_type]
    const showAllCategories = category_state === 'all'
    let oldest_time = Infinity
    let youngest_time = -Infinity
    allItems.forEach(item => {
      if (item.created_utc < oldest_time) {
        oldest_time = item.created_utc
      }
      if (item.created_utc > youngest_time) {
        youngest_time = item.created_utc
      }
    })
    let num_showing = visibleItems.length.toLocaleString()
    if (! showAllCategories) {
      num_showing = (visibleItems.filter(item =>
        item[category_unique_field] === category_state)
        .length)
    }
    let timeFrame =
      <div className='non-item text'>
        since <Time created_utc={oldest_time} />
      </div>
    if (gs.before || gs.before_id) {
      timeFrame =
        <React.Fragment>
          <div className='non-item text'>
            <Time created_utc={oldest_time} showDate='true' /> -&nbsp;
            <Time created_utc={youngest_time} showDate='true' />
          </div>
          <div className='non-item text'>
            timespan {getPrettyTimeLength(youngest_time - oldest_time)}
          </div>
        </React.Fragment>
    }
    const posts_page_title = 'user-deleted posts that have no comments are not shown'
    return (
      <React.Fragment>
        {timeFrame}
        <div title={page_type === 'subreddit_posts' ? posts_page_title : ''} className='non-item text'>{num_showing} of {allItems.length.toLocaleString()}</div>
      </React.Fragment>
    )
  }
}
export default connect(ResultsSummary)
