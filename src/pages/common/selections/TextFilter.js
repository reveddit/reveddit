import React from 'react'
import { connect } from 'state'
import { withRouter } from 'react-router';

class TextFilter extends React.Component {

  render() {
    const updateStateAndURL = this.props.global.selection_update
    const title = 'Word filter'
    const textValue = this.props.global.state.keywords
    return (
      <div className={`textFilter selection filter ${textValue.trim().length !== 0 ? 'set': ''}`}>
        <div className='title'>{title}</div>
          <input type='text'
            name='keywords' value={textValue} placeholder='keywords' autoFocus='autoFocus'
            onChange={(e) => updateStateAndURL('keywords', e.target.value, this.props)}
          />
      </div>
    )
  }
}

export default withRouter(connect(TextFilter))
