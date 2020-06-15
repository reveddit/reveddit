import React from 'react'
import {itemIsCollapsed} from 'utils'

export const ANTI_EVIL_REMOVED = 'anti_evil_ops'
export const AUTOMOD_REMOVED = 'automod'
export const AUTOMOD_REMOVED_MOD_APPROVED = 'automod-rem-mod-app'
export const MOD_OR_AUTOMOD_REMOVED = 'mod'
export const UNKNOWN_REMOVED = 'unknown'
export const NOT_REMOVED = 'none'
export const USER_REMOVED = 'user'
export const LOCKED = 'locked'
export const COLLAPSED = 'collapsed'
export const MISSING_IN_THREAD = 'missing'
export const ORPHANED = 'orphaned'
export const AUTOMOD_LATENCY_THRESHOLD = 15

export const REMOVAL_META = {
                 [ANTI_EVIL_REMOVED]: {filter_text: 'reddit anti-evil ops removed',
                                         label: '[removed] by reddit anti-evil ops',
                                          desc: 'removed by an admin'},
        [MOD_OR_AUTOMOD_REMOVED]: {filter_text: 'likely mod removed (maybe automod)',
                                         label: '[removed] likely by mod (maybe automod)',
                                          desc: '90% chance this was removed by a moderator, 10% chance removed by automod'},
               [AUTOMOD_REMOVED]: {filter_text: 'automod removed',
                                         label: '[removed] by automod',
                                          desc: '100% certain, automod removed'},
  [AUTOMOD_REMOVED_MOD_APPROVED]: {filter_text: 'automod removed, manually approved',
                                         label: '[approved] automod removed, manually approved',
                                          desc: 'This content was initially auto-removed by automoderator and later manually approved by a moderator.'},
               [UNKNOWN_REMOVED]: {filter_text: 'unknown if mod or automod removed',
                                         label: '[removed] unknown if by mod or automod',
                                          desc: 'Cannot say with certainty whether this was removed by a mod or by automod.'},
                        [LOCKED]: {filter_text: 'locked',
                                         label: 'locked',
                                          desc: 'locked'}
                            }

export const COLLAPSED_META = {filter_text: 'collapsed',
                                     label: 'collapsed',
                                      desc: 'Comment has a positive score and is collapsed in the thread'}

export const MISSING_IN_THREAD_META = {filter_text: 'missing',
                                             label: 'missing in thread',
                                              desc: 'Comment does not appear on the reddit thread unless directly linked'}

export const ORPHANED_META = {filter_text: 'comment parent or link removed',
                                     desc: 'The thread or the parent of the comment was removed'}


export const USER_REMOVED_META = {filter_text: 'user deleted',
                                        label: '[deleted] by user',
                                         desc: 'user deleted'}

export default (props) => {
  let displayTag = '', title = '', text = '', details = '', meta = undefined
  const {removedby} = props
  if (removedby && removedby !== NOT_REMOVED && removedby !== USER_REMOVED) {
    meta = REMOVAL_META[removedby]
  } else if (removedby === USER_REMOVED) {
    meta = USER_REMOVED_META
  } else if (props.missing_in_thread) {
    meta = MISSING_IN_THREAD_META
  } else if (itemIsCollapsed(props)) {
    meta = COLLAPSED_META
  }
  const modlog = props.modlog
  if (modlog && modlog.details && modlog.details !== 'remove') {
    details = ' | ' + modlog.details
  }
  if (meta) {
    title = meta.desc
    displayTag = <span title={title} data-removedby={removedby} className='removedby'>{meta.label+details}</span>
  }
  return displayTag
}
