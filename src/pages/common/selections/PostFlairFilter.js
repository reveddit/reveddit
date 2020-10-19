import React from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { QuestionMark } from 'pages/common/svg'
import ModalContext from 'contexts/modal'
import { help } from 'pages/common/selections/TextFilter'

const flair_help = help('Post Flair')

class PostFlairFilter extends React.Component {
  static contextType = ModalContext
  state = {local: ""}

  componentDidMount() {
    const param = new SimpleURLSearchParams(window.location.search).get('post_flair') || ''
    if (param.trim().length) {
      this.setState({local: decodeURIComponent(param)})
    }
    this.updateStateAndURL = debounce(this.props.global.selection_update, 500)
  }

  changeLocalFast_DelayedGlobalStateUpdate = (e) => {
    this.setState({local: e.target.value})
    this.updateStateAndURL('post_flair', e.target.value, this.props.page_type)
  }

  render() {
    const textValue = this.state.local
    const modal = this.context
    return (
      <div className={`textFilter selection filter ${textValue.trim().length !== 0 ? 'set': ''}`}>
        <div className='title nowrap'>Post Flair<a className='pointer' onClick={() => modal.openModal({content:flair_help})}>
            <QuestionMark style={{marginLeft: '10px'}} wh='20'/>
          </a>
        </div>
        <input type='text'
          name='post_flair' value={textValue} placeholder='post flair'
          onChange={(e) => this.changeLocalFast_DelayedGlobalStateUpdate(e)}
        />
      </div>
    )
  }
}

export default connect(PostFlairFilter)
