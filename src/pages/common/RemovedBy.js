import React from 'react'
import {itemIsCollapsed, commentIsMissingInThread,
        isPost, getRemovedWithinText, postRemovedUnknownWithin} from 'utils'
import {www_reddit} from 'api/reddit'
import ModalContext from 'contexts/modal'
import {QuestionMark} from 'pages/common/svg'

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

export const ORPHANED_META = {filter_text: 'orphaned',
                                     desc: 'The link itself or the direct parent of the comment was removed.',
                                 morelink: '/r/TheoryOfReddit/comments/hctddn/reddit_has_a_problem_false_posts_get_removed/fvi50y9/?context=3&add_user=rhaksw.1..new...t1_fvi5di8#t1_fvi50y9'}

export const USER_REMOVED_META = {filter_text: 'user deleted',
                                        label: '[deleted] by user',
                                         desc: 'The author of this content deleted it. Posts may have been first removed by a moderator.',
                                     morelink: www_reddit+'/r/removeddit/comments/ir1oyw/_/g5fgxgl/?context=3#thing_t1_g5fgxgl'}

export const ALL_ACTIONS_META = {
  ...REMOVAL_META,
  [COLLAPSED]: COLLAPSED_META,
  [MISSING_IN_THREAD]: MISSING_IN_THREAD_META,
  [ORPHANED]: ORPHANED_META,
  [USER_REMOVED]: USER_REMOVED_META,
}

const RemovedBy = (props) => {
  const modal = React.useContext(ModalContext)
  let displayTag = '', details = '', meta = undefined, withinText = '', fill = 'rgb(199,3,0)', everythingExceptLocked = '', lockedTag = ''
  let {removedby, orphaned_label = '', style, locked, removed} = props
  if (removed && ! removedby) {
    removedby = UNKNOWN_REMOVED
  }
  if (removedby === ORPHANED) {
    meta = ORPHANED_META
    orphaned_label = '[orphaned] '+orphaned_label
  } else if (removedby && removedby !== NOT_REMOVED && removedby !== USER_REMOVED) {
    meta = REMOVAL_META[removedby]
    if (removedby === UNKNOWN_REMOVED && isPost(props) &&
        postRemovedUnknownWithin(props)) {
      withinText = ','+getRemovedWithinText(props)
    } else if (removedby === AUTOMOD_REMOVED_MOD_APPROVED) {
      fill = 'white'
    }
    const modlog = props.modlog
    if (modlog && modlog.details && modlog.details !== 'remove') {
      details = ' | ' + modlog.details
    }
  } else if (removedby === USER_REMOVED) {
    meta = USER_REMOVED_META
  } else if (commentIsMissingInThread(props)) {
    removedby = MISSING_IN_THREAD
    meta = MISSING_IN_THREAD_META
  } else if (itemIsCollapsed(props)) {
    removedby = COLLAPSED
    meta = COLLAPSED_META
  } else if (props.deleted) {
    removedby = USER_REMOVED
    meta = USER_REMOVED_META
  }
  if (meta) {
    everythingExceptLocked =
      <a className='pointer' onClick={() => modal.openModal({hash:'action_'+removedby+'_help'})} style={{marginRight: '5px'}}>
        <span title={meta.desc} data-removedby={removedby} className='removedby'>{orphaned_label+(meta.label || '')+withinText+details} <QuestionMark fill={fill}/></span>
      </a>
  }
  if (locked) {
    lockedTag =
      <a className='pointer' onClick={() => modal.openModal({hash:'action_locked_help'})}>
        <span className='lockedTag'>locked <QuestionMark fill={'black'}/></span>
      </a>
  }
  if (everythingExceptLocked || lockedTag) {
    displayTag =
      <div style={style}>
        {everythingExceptLocked}
        {lockedTag}
      </div>
  }
  return displayTag
}

const quarantinedInfo =
  <div>
    <h3>Quarantined</h3>
    <p><a target='_blank' href='https://reddit.zendesk.com/hc/en-us/articles/360043069012-Quarantined-Subreddits'>More info</a></p>
  </div>

export const QuarantinedLabel = ({quarantine}) => {
  const modal = React.useContext(ModalContext)
  if (quarantine) {
    return (
      <a className='pointer' onClick={() => modal.openModal({content:quarantinedInfo})}>
        <span className="quarantined">quarantined <QuestionMark wh='12' fill={'black'}/></span>
      </a>
    )
  }
  return ''
}

export default RemovedBy
