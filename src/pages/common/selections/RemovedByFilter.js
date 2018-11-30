import React from 'react'
import { connect } from 'state'
import { withRouter } from 'react-router';
import { REMOVAL_META } from 'pages/common/RemovedBy'

const paramKey = 'removedby'

class RemovedByFilter extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    let value = queryParams.get(paramKey)
    if (! value) {
      value = ''
    }
    this.props.global.setRemovedByFilter_viaString(value)
  }

  updateStateAndURL = (event) => {
    this.props.global.setRemovedByFilter(event.target.value, event.target.checked)
    const queryParams = new URLSearchParams(this.props.location.search)
    let removedby_str = queryParams.get(paramKey)
    if (! removedby_str) {
      removedby_str = ''
    }
    const removedby_settings = {}
    removedby_str.split(',').forEach(type => {
      if (type.trim()) {
        removedby_settings[type.trim()] = true
      }
    })
    if (event.target.checked) {
      removedby_settings[event.target.value] = true
    } else {
      delete removedby_settings[event.target.value]
    }

    removedby_str = Object.keys(removedby_settings).join()
    if (removedby_str) {
      queryParams.set(paramKey, removedby_str)
    } else {
      queryParams.delete(paramKey)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const removedByFilter = this.props.global.state.removedByFilter

    return (
        <div className={`removedbyFilter selection filter ${Object.keys(removedByFilter).length !== 0 ? 'set': ''}`}>
          <div className='title'>Removed By</div>
          {
            Object.keys(REMOVAL_META).map(type => {
              return (
                <div key={type}>
                  <label title={REMOVAL_META[type].desc}>
                    <input id={type} type='checkbox'
                      checked={removedByFilter[type] !== undefined}
                      value={type}
                      onChange={this.updateStateAndURL}
                    />
                    <span>{REMOVAL_META[type].filter_text}</span>
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
