import React from 'react'

export const AUTOMOD_REMOVED = 'automod'
export const AUTOMOD_REMOVED_MOD_APPROVED = 'automod-rem-mod-app'
export const MOD_OR_AUTOMOD_REMOVED = 'mod'
export const UNKNOWN_REMOVED = 'unknown'
export const NOT_REMOVED = 'none'
export const USER_REMOVED = 'user'
export const LOCKED = 'locked'
export const AUTOMOD_LATENCY_THRESHOLD = 15

export const REMOVAL_META = {
               [AUTOMOD_REMOVED]: {filter_text: 'automoderator',
                                         label: 'automod',
                                          desc: '100% certain, automod removed'},
  [AUTOMOD_REMOVED_MOD_APPROVED]: {filter_text: 'automoderator - manually approved',
                                         label: 'automod removed, manually approved',
                                          desc: 'This content was initially auto-removed by automoderator and later manually approved by a moderator.'},
        [MOD_OR_AUTOMOD_REMOVED]: {filter_text: 'moderator (or maybe automoderator)',
                                         label: 'mod (or maybe automod)',
                                          desc: '90% chance this was removed by a moderator, 10% chance removed by automod'},
               [UNKNOWN_REMOVED]: {filter_text: 'unknown',
                                         label: 'unknown',
                                          desc: 'Cannot say with certainty whether this was removed by a mod or by automod.'}
                            }

export const USER_REMOVED_META = {filter_text: 'user',
                                        label: 'user',
                                         desc: 'user removed'}
export const LOCKED_META = {filter_text: 'locked',
                                          label: 'locked',
                                           desc: 'locked'}

class RemovedBy extends React.Component {
  render() {
    let removedby = ''
    const type = this.props.removedby
    if (type && type !== NOT_REMOVED) {
      const meta = REMOVAL_META[type]
      let prefix = '[removed]'
      if (type === AUTOMOD_REMOVED_MOD_APPROVED) {
        prefix = '[approved]'
      }
      const text = `${prefix} - ${meta.label}`
      removedby = <span title={meta.desc} data-removedby={type} className='removedby'>{text}</span>
    }
    return removedby
  }
}

export default RemovedBy
