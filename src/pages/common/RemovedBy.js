import React from 'react'
import {itemIsCollapsed, commentIsMissingInThread,
        isPost, getRemovedWithinText, postRemovedUnknownWithin} from 'utils'
import {www_reddit} from 'api/reddit'

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

const AUTOMOD_LINK = '/wiki/automoderator'

export const REMOVAL_META = {
                 [ANTI_EVIL_REMOVED]: {filter_text: 'reddit anti-evil ops removed',
                                         label: '[removed] by reddit anti-evil ops',
                                          desc: 'Removed by an admin.',
                                      morelink: www_reddit+'/9qf5ma'},
        [MOD_OR_AUTOMOD_REMOVED]: {filter_text: 'likely mod removed (maybe automod)',
                                         label: '[removed] likely by mod (maybe automod)',
                                          desc: '90% chance this was removed by a moderator, 10% chance removed by automod.',
                                      morelink: www_reddit+'/fifhp7'},
               [AUTOMOD_REMOVED]: {filter_text: 'automod removed',
                                         label: '[removed] by automod',
                                          desc: '100% certain, automod removed.',
                                      morelink: www_reddit+AUTOMOD_LINK},
  [AUTOMOD_REMOVED_MOD_APPROVED]: {filter_text: 'automod removed, manually approved',
                                         label: '[approved] automod removed, manually approved',
                                          desc: 'This content was initially auto-removed by automoderator and later manually approved by a moderator.',
                                      morelink: www_reddit+AUTOMOD_LINK},
               [UNKNOWN_REMOVED]: {filter_text: 'unknown if mod or automod removed',
                                         label: '[removed] unknown if by mod or automod',
                                          desc: 'Cannot say with certainty whether this was removed by a mod or by automod.',
                                      morelink: www_reddit+'/comments/cve5vl/?comment=ey4mzwq'},
                        [LOCKED]: {filter_text: 'locked',
                                         label: 'locked',
                                          desc: 'locked, replies are not permitted.',
                                      morelink: www_reddit+'/brgr8i'}
                            }

export const COLLAPSED_META = {filter_text: 'collapsed',
                                     label: 'collapsed',
                                      desc: 'The comment has a positive score and is collapsed in the thread.',
                                  morelink: www_reddit+'/e8vl4d'}

export const MISSING_IN_THREAD_META = {filter_text: 'missing in thread',
                                             label: 'missing in thread',
                                              desc: 'The comment does not appear on the reddit thread unless directly linked.',
                                          morelink: www_reddit+'/gwzbxp'}

export const ORPHANED_META = {filter_text: 'comment parent or link removed',
                                     desc: 'The thread or the parent of the comment was removed.',
                                 morelink: '/r/TheoryOfReddit/comments/hctddn/reddit_has_a_problem_false_posts_get_removed/fvi50y9/?context=3&add_user=rhaksw.1..new...t1_fvi5di8#t1_fvi50y9'}

export const USER_REMOVED_META = {filter_text: 'user deleted',
                                        label: '[deleted] by user',
                                         desc: 'The author of this content deleted it.',
                                     morelink: www_reddit+'/r/removeddit/comments/ir1oyw/_/g5fgxgl/?context=3#thing_t1_g5fgxgl'}

export const ALL_ACTIONS_META = {
  ...REMOVAL_META,
  [COLLAPSED]: COLLAPSED_META,
  [MISSING_IN_THREAD]: MISSING_IN_THREAD_META,
  [ORPHANED]: ORPHANED_META,
  [USER_REMOVED]: USER_REMOVED_META,
}

const RemovedBy = (props) => {
  let displayTag = '', title = '', text = '', details = '', meta = undefined, withinText = ''
  const {removedby} = props
  if (removedby && removedby !== NOT_REMOVED && removedby !== USER_REMOVED) {
    meta = REMOVAL_META[removedby]
    if (removedby === UNKNOWN_REMOVED && isPost(props) &&
        postRemovedUnknownWithin(props)) {
      withinText = ','+getRemovedWithinText(props)
    }
  } else if (removedby === USER_REMOVED) {
    meta = USER_REMOVED_META
  } else if (commentIsMissingInThread(props)) {
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
    displayTag = <span title={title} data-removedby={removedby} className='removedby'>{meta.label+withinText+details}</span>
  }
  return displayTag
}

export default RemovedBy
