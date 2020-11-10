import React from 'react'
import { getPrettyTimeLength, getPrettyDate } from 'utils'
import Time from 'pages/common/Time'
import { connect } from 'state'

const posts_page_title = 'user-deleted posts that have no comments are not shown'

const ConditionalWrapper = ({ condition, wrapper, children }) =>
  condition ? wrapper(children) : children

class ResultsSummary extends React.Component {
  render() {
    const {num_showing, page_type } = this.props
    const {before, before_id, items, paginationMeta,
           itemsSortedByDate = []
          } = this.props.global.state
    let {oldestTimestamp, newestTimestamp} = this.props.global.state
    if (! oldestTimestamp && itemsSortedByDate.length) {
      oldestTimestamp = itemsSortedByDate[0].created_utc
      newestTimestamp = itemsSortedByDate[itemsSortedByDate.length-1].created_utc
    }
    const youngest_pretty = getPrettyDate(newestTimestamp)
    const oldest_pretty = getPrettyDate(oldestTimestamp)

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
         className='non-item text'>
         <ConditionalWrapper condition={num_showing !== items.length}
            wrapper={children => <a className='pointer' onClick={() => this.props.global.resetFilters(page_type)}>{children}</a>}
         >{num_showing.toLocaleString()+' of ' + items.length.toLocaleString()+totalPagesText}</ConditionalWrapper>
      </div>

    if (before || before_id) {
      timeFrame =
        <div>
          <div className='non-item text'>
            <Time created_utc={oldestTimestamp} showDate='true' /> — <Time created_utc={newestTimestamp} showDate='true' />
          </div>
          <div className='non-item text'>
            timespan {getPrettyTimeLength(newestTimestamp - oldestTimestamp)}
          </div>
        </div>
    } else if (youngest_pretty !== oldest_pretty) {
      timeFrame = <div className='non-item text'>
                    <Time created_utc={newestTimestamp} pretty={youngest_pretty} />
                    <div>—</div>
                    <Time created_utc={oldestTimestamp} pretty={oldest_pretty} />
                  </div>
    } else {
      timeFrame = <div className='non-item text'>
                    since <Time created_utc={oldestTimestamp} pretty={oldest_pretty} />
                  </div>
    }
    return (
        <div>
          {timeFrame}
          {numShowingText}
          {numPagesText}
        </div>
    )
  }
}
export default connect(ResultsSummary)
