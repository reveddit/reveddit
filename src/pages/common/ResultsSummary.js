import React from 'react'
import { getPrettyTimeLength, getPrettyDate } from 'utils'
import Time from 'pages/common/Time'
import { connect } from 'state'

const posts_page_title = 'user-deleted posts that have no comments are not shown'

class ResultsSummary extends React.Component {
  render() {
    const {num_showing, page_type} = this.props
    const {before, before_id, items, paginationMeta} = this.props.global.state
    let oldest_time = Infinity
    let youngest_time = -Infinity
    items.forEach(item => {
      if (item.created_utc < oldest_time && (page_type === 'thread' || ! item.modlog)) {
        oldest_time = item.created_utc
      }
      if (item.created_utc > youngest_time) {
        youngest_time = item.created_utc
      }
    })
    const youngest_pretty = getPrettyDate(youngest_time)
    const oldest_pretty = getPrettyDate(oldest_time)

    let timeFrame = ''
    let numPagesText = '', totalPagesText = ''
    if (paginationMeta && paginationMeta.num_pages > 1) {
      const total = paginationMeta.total_count
      if (total > items.length) {
        totalPagesText = ` (${total.toLocaleString()})`
      }
      numPagesText = (
        <div className='non-item text'>page {paginationMeta.page_number} of {paginationMeta.num_pages}</div>
      )
    }
    // WARNING: a class name & attribute are used by the reveddit extension:
    // #numItemsLoaded, data-numitemsloaded
    const numShowingText =
      <div id='numItemsLoaded' data-numitemsloaded={items.length} title={page_type === 'subreddit_posts' ? posts_page_title : ''}
         className='non-item text'>{num_showing.toLocaleString()+' of '}
         {items.length.toLocaleString()}{totalPagesText}</div>

    if (before || before_id) {
      timeFrame =
        <div>
          <div className='non-item text'>
            <Time created_utc={oldest_time} showDate='true' /> -&nbsp;
            <Time created_utc={youngest_time} showDate='true' />
          </div>
          <div className='non-item text'>
            timespan {getPrettyTimeLength(youngest_time - oldest_time)}
          </div>
        </div>
    } else if (youngest_pretty !== oldest_pretty) {
      timeFrame = <div className='non-item text'>
                    <Time created_utc={youngest_time} pretty={youngest_pretty} />
                    <div>—</div>
                    <Time created_utc={oldest_time} pretty={oldest_pretty} />
                  </div>
    } else {
      timeFrame = <div className='non-item text'>
                    since <Time created_utc={oldest_time} pretty={oldest_pretty} />
                  </div>
    }
    return (
      <React.Fragment>
        <div>
          {timeFrame}
          {numShowingText}
        </div>
        {numPagesText}
      </React.Fragment>
    )
  }
}
export default connect(ResultsSummary)
