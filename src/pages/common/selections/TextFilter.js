import React from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { QuestionMark } from 'pages/common/svg'
import ModalContext from 'contexts/modal'

export const help = (title = '') => {
  return (
    <div>
      <h3>{title} filter help</h3>
      <p>Matches content containing ALL keywords</p>
      <p>To negate, prefix the word with - (minus sign)</p>
      <p>Phrase search "using quotes". Phrases are treated as javascript regular expressions. Examples,</p>
      <ul>
        <li>fox trot -delta</li>
        <li>"find this phrase" -"not this one"</li>
        <li>"\?": find a question mark</li>
        <li>"this|that": match ANY words (must use quotes)</li>
      </ul>
    </div>
  )
}

const word_help = help('Title/Body')

class TextFilter extends React.Component {
  static contextType = ModalContext
  state = {localKeywords: ""}

  componentDidMount() {
    const param = new SimpleURLSearchParams(window.location.search).get('keywords') || ''
    if (param.trim().length) {
      this.setState({localKeywords: decodeURIComponent(param)})
    }
    this.updateStateAndURL = debounce(this.props.global.selection_update, 500)
  }

  changeLocalFast_DelayedGlobalStateUpdate = (e) => {
    this.setState({localKeywords: e.target.value})
    this.updateStateAndURL('keywords', e.target.value, this.props.page_type)
  }

  render() {
    const textValue = this.state.localKeywords
    const modal = this.context
    return (
      <div className={`textFilter selection filter ${textValue.trim().length !== 0 ? 'set': ''}`}>
        <div className='title nowrap'>Title/Body<a className='pointer' onClick={() => modal.openModal({content:word_help})}>
            <QuestionMark style={{marginLeft: '10px'}} wh='20'/>
          </a>
        </div>
        <input type='text'
          name='keywords' value={textValue} placeholder='keywords'
          onChange={(e) => this.changeLocalFast_DelayedGlobalStateUpdate(e)}
        />
      </div>
    )
  }
}

export default connect(TextFilter)
