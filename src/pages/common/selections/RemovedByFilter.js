import React from 'react'
import { connect } from 'state'
import { withRouter } from 'react-router';
import { REMOVAL_META, USER_REMOVED, USER_REMOVED_META, LOCKED, LOCKED_META } from 'pages/common/RemovedBy'


class RemovedByFilter extends React.Component {

  render() {
    const {page_type, showLocked} = this.props
    const removedByFilter = this.props.global.state.removedByFilter
    let removal_meta = REMOVAL_META
    if (page_type !== 'user') {
      removal_meta[USER_REMOVED] = USER_REMOVED_META
    }
    if (showLocked) {
      removal_meta[LOCKED] = LOCKED_META
    }
    const updateStateAndURL = this.props.global.removedByFilter_update
    return (
        <div className={`removedbyFilter selection filter ${Object.keys(removedByFilter).length !== 0 ? 'set': ''}`}>
          <div className='title'>Removed By</div>
          {
            Object.keys(removal_meta).map(type => {
              return (
                <div key={type}>
                  <label title={removal_meta[type].desc}>
                    <input id={type} type='checkbox'
                      checked={removedByFilter[type] !== undefined}
                      value={type}
                      onChange={(e) => updateStateAndURL(e.target, this.props)}
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

export default withRouter(connect(RemovedByFilter))
