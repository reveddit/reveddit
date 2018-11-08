import React from 'react'
import { connect, localSort_types, localSortReverseDefault } from '../../../state'
import { withRouter } from 'react-router';

const paramKey_sortType = 'localSort'
const paramKey_reverse = 'localSortReverse'

class LocalSort extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    const paramValue_sortType = queryParams.get(paramKey_sortType)
    if (paramValue_sortType) {
      this.props.global.setLocalSort(paramValue_sortType)
    } else {
      this.props.global.setLocalSort(this.props.defaultSort)
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

    if (event.target.value === this.props.defaultSort) {
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

  render() {
    const localSortReverse = this.props.global.state.localSortReverse

    return (
        <div className={`localSort selection`}>
          <div className='title'>Sort By</div>
          {this.props.type === 'comments' ?
            <React.Fragment>
              <label>
                <input type='radio' value={localSort_types.controversiality1}
                  checked={this.isChecked(localSort_types.controversiality1)} onChange={this.updateStateAndURL_sortType}/>
                controversiality v1
              </label>
              <label>
                <input type='radio' value={localSort_types.controversiality2}
                  checked={this.isChecked(localSort_types.controversiality2)} onChange={this.updateStateAndURL_sortType}/>
                controversiality v2
              </label>
            </React.Fragment>
          :
            <label>
              <input type='radio' value={localSort_types.controversiality}
                checked={this.isChecked(localSort_types.controversiality)} onChange={this.updateStateAndURL_sortType}/>
              controversiality
            </label>
          }
          <label>
            <input type='radio' value={localSort_types.num_comments}
              checked={this.isChecked(localSort_types.num_comments)} onChange={this.updateStateAndURL_sortType}/>
            number of comments
          </label>
          <label>
            <input type='radio' value={localSort_types.score}
              checked={this.isChecked(localSort_types.score)} onChange={this.updateStateAndURL_sortType}/>
            score
          </label>
          <label>
            <input type='radio' value={localSort_types.date}
              checked={this.isChecked(localSort_types.date)} onChange={this.updateStateAndURL_sortType}/>
            date
          </label>
          <label id='reverseSort'>
            <input type='checkbox'
              checked={localSortReverse}
              onChange={this.updateStateAndURL_reverse}
            />
          reverse
          </label>
        </div>
    )
  }
}

export default withRouter(connect(LocalSort))
