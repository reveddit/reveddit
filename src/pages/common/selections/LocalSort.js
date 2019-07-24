import React from 'react'
import { connect, localSort_types } from 'state'
import { withRouter } from 'react-router';

const paramKey_sortType = 'localSort'
const paramKey_reverse = 'localSortReverse'

class LocalSort extends React.Component {

  isChecked(sortType) {
    return this.props.global.state.localSort === sortType
  }

  makeLabel(value, text) {
    const updateStateAndURL = this.props.global.selection_update
    return (
      <label>
        <input type='radio' value={localSort_types[value]}
          checked={this.isChecked(localSort_types[value])}
          onChange={(e) => updateStateAndURL('localSort', e.target.value, this.props )}/>
        <span>{text}</span>
      </label>
    )
  }

  render() {
    const localSortReverse = this.props.global.state.localSortReverse
    const showContext = this.props.global.state.showContext
    const updateStateAndURL = this.props.global.selection_update

    return (
        <div className={`localSort selection`}>
          <div className='title'>Sort By</div>
          {['thread', 'subreddit_comments'].includes(this.props.page_type) ?
            <React.Fragment>
              {this.makeLabel('controversiality1', 'controversiality v1')}
              {this.makeLabel('controversiality2', 'controversiality v2')}
            </React.Fragment>
          :
            this.makeLabel('controversiality', 'controversiality')
          }
          {['thread', 'subreddit_posts', 'domain_posts', 'info'].includes(this.props.page_type) &&
            this.makeLabel('num_comments', 'number of comments')}
          {['thread', 'subreddit_comments'].includes(this.props.page_type) &&
            this.makeLabel('comment_length', 'comment length')}

          {this.makeLabel('score', 'score')}
          {this.makeLabel('date', 'date')}
          <label id='reverseSort'>
            <input type='checkbox'
              checked={localSortReverse}
              onChange={(e) => updateStateAndURL('localSortReverse', e.target.checked, this.props)}
            />
            <span>reverse</span>
          </label>
          { ['thread'].includes(this.props.page_type) &&
            <label id='context'>
              <input type='checkbox'
                checked={showContext}
                onChange={(e) => updateStateAndURL('showContext', e.target.checked, this.props)}
              />
              <span>context</span>
            </label>
          }
        </div>
    )
  }
}

export default withRouter(connect(LocalSort))
