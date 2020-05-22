import React from 'react'
import { connect } from 'state'
import { REMOVAL_META, ANTI_EVIL_REMOVED, USER_REMOVED, USER_REMOVED_META,
         COLLAPSED, COLLAPSED_META, MISSING_IN_THREAD, MISSING_IN_THREAD_META,
         ORPHANED, ORPHANED_META
} from 'pages/common/RemovedBy'


class RemovedByFilter extends React.Component {

  render() {
    const {page_type} = this.props
    const removedByFilter = this.props.global.state.removedByFilter
    let removal_meta = REMOVAL_META
    if (page_type !== 'user') {
      removal_meta[USER_REMOVED] = USER_REMOVED_META
    }
    if (['thread', 'user', 'subreddit_comments', 'info', 'search'].includes(page_type)) {
      removal_meta[COLLAPSED] = COLLAPSED_META
    }
    if (['thread', 'subreddit_comments'].includes(page_type)) {
      delete removal_meta[ANTI_EVIL_REMOVED]
    }
    if (['thread', 'missing_comments'].includes(page_type)) {
      removal_meta[MISSING_IN_THREAD] = MISSING_IN_THREAD_META
    }
    if (['user', 'subreddit_comments', 'info', 'search', 'missing_comments'].includes(page_type)) {
      removal_meta[ORPHANED] = ORPHANED_META
    }
    const updateStateAndURL = this.props.global.removedByFilter_update
    return (
        <div className={`removedbyFilter selection filter ${Object.keys(removedByFilter).length !== 0 ? 'set': ''}`}>
          <div className='title'>Action</div>
          {
            Object.keys(removal_meta).map(type => {
              return (
                <div key={type}>
                  <label title={removal_meta[type].desc}>
                    <input id={type} type='checkbox'
                      checked={removedByFilter[type] !== undefined}
                      value={type}
                      onChange={(e) => updateStateAndURL(e.target, page_type)}
                    />
                    <span>{removal_meta[type].filter_text}</span>
                  </label>
                </div>
              )
            })
          }
        </div>
    )
  }
}

export default connect(RemovedByFilter)
