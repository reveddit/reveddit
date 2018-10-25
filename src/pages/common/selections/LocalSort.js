import React from 'react'
import { connect, localSort_types } from '../../../state'
import { withRouter } from 'react-router';

const paramKey = 'localSort'

class LocalSort extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    const paramValue = queryParams.get(paramKey)
    if (paramValue) {
      this.props.global.setLocalSort(paramValue)
    }
  }

  isChecked(sortType) {
    return this.props.global.state.localSort === sortType
  }

  updateStateAndURL = (event) => {
    this.props.global.setLocalSort(event.target.value)

    const queryParams = new URLSearchParams(this.props.location.search)

    if (event.target.value === localSort_types.default) {
      queryParams.delete(paramKey)
    } else {
      queryParams.set(paramKey, event.target.value)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const localSort = this.props.global.state.localSort

    return (
        <div className={`localSort selection`}>
          <div className='title'>Sort By</div>
          <label>
            <input name='localSort_types' type='radio' value={localSort_types.num_comments}
              checked={this.isChecked(localSort_types.num_comments)} onChange={this.updateStateAndURL}/>
            number of comments
          </label>
          <label>
            <input name='localSort_types' type='radio' value={localSort_types.score}
              checked={this.isChecked(localSort_types.score)} onChange={this.updateStateAndURL}/>
            score
          </label>
          <label>
            <input name='localSort_types' type='radio' value={localSort_types.date}
              checked={this.isChecked(localSort_types.date)} onChange={this.updateStateAndURL}/>
            date
          </label>
        </div>
    )
  }
}

export default withRouter(connect(LocalSort))
