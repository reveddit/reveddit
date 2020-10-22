import React from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { QuestionMark } from 'pages/common/svg'
import { help } from 'pages/common/selections/TextFilter'
import { Selection } from './SelectionBase'

const flair_help = help('Post Flair')

class PostFlairFilter extends React.Component {
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
    return (
      <Selection className='textFilter' isFilter={true} isSet={textValue.trim().length !== 0}
                 title='Post Flair' titleHelpModal={{content:flair_help}}>
        <input type='text'
          name='post_flair' value={textValue} placeholder='post flair'
          onChange={(e) => this.changeLocalFast_DelayedGlobalStateUpdate(e)}
        />
      </Selection>
    )
  }
}

export default connect(PostFlairFilter)
