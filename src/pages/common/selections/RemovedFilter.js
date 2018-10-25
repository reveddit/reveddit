import React from 'react'
import { connect, removedFilter_types } from '../../../state'
import { withRouter } from 'react-router';
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED } from '../RemovedBy'

const paramKey = 'removal_status'

class RemovedFilter extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    if (queryParams.get(paramKey) === 'all') {
      this.props.global.setRemovedFilter(removedFilter_types.all)
    } else if (queryParams.get(paramKey) === 'not_removed') {
      this.props.global.setRemovedFilter(removedFilter_types.not_removed)
    }
  }

  isChecked(filterType) {
    return this.props.global.state.removedFilter === filterType
  }
  updateStateAndURL = (event) => {
    this.props.global.setRemovedFilter(event.target.value)

    const queryParams = new URLSearchParams(this.props.location.search)
    if (event.target.value === removedFilter_types.all) {
      queryParams.set(paramKey, 'all')
    } else if (event.target.value === removedFilter_types.not_removed) {
      queryParams.set(paramKey, 'not_removed')
    } else {
      queryParams.delete(paramKey)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const removedFilter = this.props.global.state.removedFilter

    return (
        <div className={`removalStatusFilter filter ${removedFilter !== removedFilter_types.all ? 'set': ''}`}>
          <div className='title'>Removal Status</div>
          <label>
            <input name='removedFilter_types' type='radio' value={removedFilter_types.all}
              checked={this.isChecked(removedFilter_types.all)} onChange={this.updateStateAndURL}/>
            all
          </label>
          <label>
            <input name='removedFilter_types' type='radio' value={removedFilter_types.removed}
              checked={this.isChecked(removedFilter_types.removed)} onChange={this.updateStateAndURL}/>
            removed
          </label>
          <label>
            <input name='removedFilter_types' type='radio' value={removedFilter_types.not_removed}
              checked={this.isChecked(removedFilter_types.not_removed)} onChange={this.updateStateAndURL}/>
            not removed
          </label>
        </div>
    )
  }
}

export default withRouter(connect(RemovedFilter))
