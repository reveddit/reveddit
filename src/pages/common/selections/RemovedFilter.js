import React from 'react'
import { connect, removedFilter_types } from '../../../state'
import { withRouter } from 'react-router';
import { REMOVAL_META, AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED, MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED } from '../RemovedBy'

const paramKey = 'removal_status'

class RemovedFilter extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    const paramValue = queryParams.get(paramKey)
    const defaultValue = removedFilter_types[this.props.page_type+'_default']
    if (paramValue in removedFilter_types) {
      this.props.global.setRemovedFilterAndDefault(paramValue, defaultValue)
    } else {
      this.props.global.setRemovedFilterAndDefault(defaultValue, defaultValue)
    }
  }

  isChecked(filterType) {
    return this.props.global.state.removedFilter === filterType
  }
  updateStateAndURL = (event) => {
    this.props.global.setRemovedFilter(event.target.value)

    const queryParams = new URLSearchParams(this.props.location.search)
    if (event.target.value === this.props.global.state.selection_defaults.removedFilter) {
      queryParams.delete(paramKey)
    } else {
      queryParams.set(paramKey, event.target.value)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const removedFilter = this.props.global.state.removedFilter

    return (
        <div className={`removalStatusFilter selection filter ${removedFilter !== removedFilter_types.all ? 'set': ''}`}>
          <div className='title'>Removal Status</div>
          <label>
            <input name='removedFilter_types' type='radio' value={removedFilter_types.all}
              checked={this.isChecked(removedFilter_types.all)} onChange={this.updateStateAndURL}/>
            <span>all</span>
          </label>
          <label>
            <input name='removedFilter_types' type='radio' value={removedFilter_types.removed}
              checked={this.isChecked(removedFilter_types.removed)} onChange={this.updateStateAndURL}/>
            <span>removed</span>
          </label>
          <label>
            <input name='removedFilter_types' type='radio' value={removedFilter_types.not_removed}
              checked={this.isChecked(removedFilter_types.not_removed)} onChange={this.updateStateAndURL}/>
            <span>not removed</span>
          </label>
        </div>
    )
  }
}

export default withRouter(connect(RemovedFilter))
