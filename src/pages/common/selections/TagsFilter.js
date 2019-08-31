import React from 'react'
import { connect } from 'state'
import { withRouter } from 'react-router';

export const IS_OP = 'is_op'
export const MOD = 'mod'
export const QUARANTINE = 'quarantine'
export const ADMIN = 'admin'

export const TAG_META = {[IS_OP]: {
                          field: 'is_op',
                          value: true,
                          text: 'OP'},
                         [MOD]: {
                           field: 'distinguished',
                           value: 'moderator',
                           text: 'moderator'},
                         [ADMIN]: {
                           field: 'distinguished',
                           value: 'admin',
                           text: 'admin'},
                         [QUARANTINE]: {
                           field: 'quarantine',
                           value: true,
                           text: 'quarantined'}
                         }

class TagsFilter extends React.Component {

  render() {
    const {page_type} = this.props
    const tagsFilter = this.props.global.state.tagsFilter
    const updateStateAndURL = this.props.global.tagsFilter_update
    return (
        <div className={`tagsFilter selection filter ${Object.keys(tagsFilter).length !== 0 ? 'set': ''}`}>
          <div className='title'>Tags</div>
          {
            Object.keys(TAG_META).map(type => {
              return (
                <div key={type}>
                  <label title={TAG_META[type].text}>
                    <input id={type} type='checkbox'
                      checked={tagsFilter[type] !== undefined}
                      value={type}
                      onChange={(e) => updateStateAndURL(e.target, this.props)}
                    />
                    <span>{TAG_META[type].text}</span>
                  </label>
                </div>
              )
            })
          }
        </div>
    )
  }
}

export default withRouter(connect(TagsFilter))
