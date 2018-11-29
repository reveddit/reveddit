import React from 'react'
import { connect, localSort_types, localSortReverseDefault } from 'state'
import { withRouter } from 'react-router';

const paramKey_sortType = 'localSort'
const paramKey_reverse = 'localSortReverse'

class LocalSort extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    const paramValue_sortType = queryParams.get(paramKey_sortType)
    const defaultValue_sortType = localSort_types[this.props.page_type+'_default']
    if (paramValue_sortType in localSort_types) {
      this.props.global.setLocalSortAndDefault(paramValue_sortType, defaultValue_sortType)
    } else {
      this.props.global.setLocalSortAndDefault(defaultValue_sortType, defaultValue_sortType)
    }
    const paramValue_reverse = queryParams.get(paramKey_reverse)
    if (paramValue_reverse) {
      this.props.global.setLocalSortReverse(paramValue_reverse)
    }
  }

  isChecked(sortType) {
    return this.props.global.state.localSort === sortType
  }

  updateStateAndURL_sortType = (event) => {
    this.props.global.setLocalSort(event.target.value)

    const queryParams = new URLSearchParams(this.props.location.search)

    if (event.target.value === this.props.global.state.selection_defaults.localSort) {
      queryParams.delete(paramKey_sortType)
    } else {
      queryParams.set(paramKey_sortType, event.target.value)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  updateStateAndURL_reverse = (event) => {
    this.props.global.setLocalSortReverse(event.target.checked)

    const queryParams = new URLSearchParams(this.props.location.search)

    if (event.target.checked === localSortReverseDefault) {
      queryParams.delete(paramKey_reverse)
    } else {
      queryParams.set(paramKey_reverse, event.target.checked)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  makeLabel(value, text) {
    return (
      <label>
        <input type='radio' value={localSort_types[value]}
          checked={this.isChecked(localSort_types[value])} onChange={this.updateStateAndURL_sortType}/>
        <span>{text}</span>
      </label>
    )
  }

  render() {
    const localSortReverse = this.props.global.state.localSortReverse
    return (
        <div className={`localSort selection`}>
          <div className='title'>Sort By</div>
          {this.props.page_type === 'thread' ?
            <React.Fragment>
              {this.makeLabel('controversiality1', 'controversiality v1')}
              {this.makeLabel('controversiality2', 'controversiality v2')}
            </React.Fragment>
          :
            this.makeLabel('controversiality', 'controversiality')
          }
          {this.makeLabel('num_comments', 'number of comments')}
          {this.makeLabel('score', 'score')}
          {this.makeLabel('date', 'date')}
          <label id='reverseSort'>
            <input type='checkbox'
              checked={localSortReverse}
              onChange={this.updateStateAndURL_reverse}
            />
            <span>reverse</span>
          </label>
        </div>
    )
  }
}

export default withRouter(connect(LocalSort))
