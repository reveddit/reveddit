import React from 'react'
import {itemIsCollapsed} from 'utils'

export const AUTOMOD_REMOVED = 'automod'
export const AUTOMOD_REMOVED_MOD_APPROVED = 'automod-rem-mod-app'
export const MOD_OR_AUTOMOD_REMOVED = 'mod'
export const UNKNOWN_REMOVED = 'unknown'
export const NOT_REMOVED = 'none'
export const USER_REMOVED = 'user'
export const LOCKED = 'locked'
export const COLLAPSED = 'collapsed'
export const AUTOMOD_LATENCY_THRESHOLD = 15

export const REMOVAL_META = {
        [MOD_OR_AUTOMOD_REMOVED]: {filter_text: 'mod removed (or maybe automod)',
                                         label: 'mod (or maybe automod)',
                                          desc: '90% chance this was removed by a moderator, 10% chance removed by automod'},
               [AUTOMOD_REMOVED]: {filter_text: 'automod removed',
                                         label: 'automod',
                                          desc: '100% certain, automod removed'},
  [AUTOMOD_REMOVED_MOD_APPROVED]: {filter_text: 'automod removed, manually approved',
                                         label: 'automod removed, manually approved',
                                          desc: 'This content was initially auto-removed by automoderator and later manually approved by a moderator.'},
               [UNKNOWN_REMOVED]: {filter_text: 'unknown',
                                         label: 'unknown',
                                          desc: 'Cannot say with certainty whether this was removed by a mod or by automod.'},
                        [LOCKED]: {filter_text: 'locked',
                                         label: 'locked',
                                          desc: 'locked'}
                            }

export const COLLAPSED_META = {filter_text: 'collapsed',
                                     label: 'collapsed',
                                      desc: 'Comment has a positive score and is collapsed in the thread'}

export const USER_REMOVED_META = {filter_text: 'user deleted',
                                        label: 'user',
                                         desc: 'user removed'}

export default (props) => {
  let displayTag = '', title = '', data_removedby = '', text = ''
  const {removedby} = props
  if (removedby && removedby !== NOT_REMOVED) {
    const meta = REMOVAL_META[removedby]
    let prefix = '[removed]'
    if (removedby === AUTOMOD_REMOVED_MOD_APPROVED) {
      prefix = '[approved]'
    }
    title = meta.desc
    data_removedby = removedby
    text = `${prefix} - ${meta.label}`
  } else if (itemIsCollapsed(props)) {
    const meta = COLLAPSED_META
    title = meta.desc
    data_removedby = removedby
    text = `[${meta.label}]`
  }
  if (text) {
    displayTag = <span title={title} data-removedby={data_removedby} className='removedby'>{text}</span>
  }
  return displayTag
}
