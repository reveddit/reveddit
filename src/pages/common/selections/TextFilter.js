import React from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import { debounce } from 'lodash'

class TextFilter extends React.Component {

  state = {localKeywords: ""}

  componentDidMount() {
    const param = new SimpleURLSearchParams(window.location.search).get('keywords') || ''
    if (param.trim().length) {
      this.setState({localKeywords: param})
    }
    this.updateStateAndURL = debounce(this.props.global.selection_update, 500)
  }

  changeLocalFast_DelayedGlobalStateUpdate = (e) => {
    this.setState({localKeywords: e.target.value})
    this.updateStateAndURL('keywords', e.target.value, this.props.page_type)
  }

  render() {
    const title = 'Word filter'
    const textValue = this.state.localKeywords
    return (
      <div className={`textFilter selection filter ${textValue.trim().length !== 0 ? 'set': ''}`}>
        <div className='title'>{title}</div>
          <input type='text'
            name='keywords' value={decodeURIComponent(textValue)} placeholder='keywords' autoFocus='autoFocus'
            onChange={(e) => this.changeLocalFast_DelayedGlobalStateUpdate(e)}
          />
      </div>
    )
  }
}

export default connect(TextFilter)
