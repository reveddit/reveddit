import React from 'react'
import {itemIsCollapsed, commentIsMissingInThread,
        isPost, getRemovedWithinText, postRemovedUnknownWithin,

} from 'utils'
import ModalContext from 'contexts/modal'
import {QuestionMark} from 'pages/common/svg'
import ActionHelp from 'pages/modals/ActionHelp'

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
export const RESTORED = 'restored'
export const AUTOMOD_LATENCY_THRESHOLD = 25

const AUTOMOD_LINK = '/wiki/automoderator'
const faq = '/about/faq/'

export const REMOVAL_META = {
                 [ANTI_EVIL_REMOVED]: {filter_text: 'anti-evil ops removed',
                                         label: '[removed] by reddit anti-evil ops',
                                          desc: 'Removed by an admin.',
                                   reddit_link: '/9qf5ma'},
        [MOD_OR_AUTOMOD_REMOVED]: {filter_text: 'mod removed',
                                         label: '[removed] by mod',
                                          desc: 'Likely removed by a moderator. There is also a chance it was removed by automod.',
                                   reddit_link: '/fifhp7'},
               [AUTOMOD_REMOVED]: {filter_text: 'automod removed',
                                         label: '[removed] by automod',
                                          desc: 'Likely removed by automod.',
                                   reddit_link: AUTOMOD_LINK},
  [AUTOMOD_REMOVED_MOD_APPROVED]: {filter_text: 'auto-removed -> approved',
                                         label: '[approved] auto-removed, then approved',
                                          desc: 'This content was initially auto-removed by automoderator and later manually approved by a moderator.',
                                   reddit_link: AUTOMOD_LINK},
               [UNKNOWN_REMOVED]: {filter_text: 'unknown removed',
                                         label: '[removed] unknown if by mod/automod',
                                          desc: 'Cannot say with certainty whether this was removed by a mod or by automod.',
                                    local_link: faq+'#unknown-removed'},
                        [LOCKED]: {filter_text: 'locked',
                                         label: 'locked',
                                          desc: 'locked, replies are not permitted.',
                                   reddit_link: '/brgr8i'}
                            }

export const COLLAPSED_META = {filter_text: 'collapsed',
                                     label: 'collapsed',
                                      desc: 'The comment has a positive score and is collapsed in the thread.',
                               reddit_link: '/e8vl4d'}

export const MISSING_IN_THREAD_META = {filter_text: 'missing in thread',
                                             label: 'missing in thread',
                                              desc: 'The comment does not appear on the reddit thread unless directly linked.',
                                       reddit_link: '/gwzbxp'}

export const ORPHANED_META = {filter_text: 'orphaned',
                                     desc: 'The link itself or the direct parent of the comment was removed.',
                               local_link: '/r/TheoryOfReddit/comments/hctddn/reddit_has_a_problem_false_posts_get_removed/fvi50y9/?context=3&add_user=rhaksw.1..new...t1_fvi5di8#t1_fvi50y9'}

export const USER_REMOVED_META = {filter_text: 'user deleted',
                                        label: '[deleted] by user',
                                         desc: 'The author of this content deleted it. Posts may have been first removed by a moderator.',
                                  reddit_link: '/r/removeddit/comments/ir1oyw/_/g5fgxgl/?context=3#thing_t1_g5fgxgl'}

export const RESTORED_META = {filter_text: 'restored via user page',
                                    label: 'restored via user page',
                                     desc: "This comment was not archived but could be copied from the author's /user page on reddit.",
                              local_link: '/about/faq/#restored'}

export const ALL_ACTIONS_META = {
  ...REMOVAL_META,
  [COLLAPSED]: COLLAPSED_META,
  [MISSING_IN_THREAD]: MISSING_IN_THREAD_META,
  [ORPHANED]: ORPHANED_META,
  [USER_REMOVED]: USER_REMOVED_META,
  [RESTORED]: RESTORED_META,
}
export const preserve_desc = <><b>preserve:</b> This stores the location of the comment in the URL and copies the new URL to the clipboard. If the comment is later removed by a moderator, or if the archive becomes unavailable, then it can be viewed with this URL.</>
const temp_vis_txt = 'Temporarily visible'
const temp_vis_help = (<>
  <h3>{temp_vis_txt}</h3>
  <p>This comment is only visible here until it falls out of the most recent mod log items. To save it, click {preserve_desc}</p>
</>)


const RemovedBy = (props) => {
  let displayTag = '', details = '', meta = undefined, withinText = '', fill = undefined,
      allActionsExceptLocked = '', lockedTag = '', temporarilyVisible = ''
  let {removedby, orphaned_label = '', style, locked, removed, deleted} = props
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
    if (modlog && props.archive_body_removed_before_modlog_copy) {
      temporarilyVisible =
        <LabelWithModal content={temp_vis_help}>
          <span title={temp_vis_txt} className='removedby'>temporarily visible <QuestionMark/></span>
        </LabelWithModal>
      if (modlog.details && modlog.details !== 'remove') {
        details = ' | ' + modlog.details
      }
    }
  } else if (removedby === USER_REMOVED) {
    meta = USER_REMOVED_META
  } else if (commentIsMissingInThread(props)) {
    removedby = MISSING_IN_THREAD
    meta = MISSING_IN_THREAD_META
  } else if (itemIsCollapsed(props)) {
    removedby = COLLAPSED
    meta = COLLAPSED_META
  } else if (deleted) {
    removedby = USER_REMOVED
    meta = USER_REMOVED_META
  }
  if (meta) {
    let modalDetails = ''
    if (removedby === AUTOMOD_REMOVED) {
      if (! props.modlog) {
        modalDetails = getRemovedWithinText(props)
      } else {
        modalDetails = 'Modlogs indicate automod removed this item.'
      }
    } else if (props.modlog) {
      modalDetails = 'Modlogs mod: '+props.modlog.mod
    }
    allActionsExceptLocked =
      <LabelWithModal hash={'action_'+removedby+'_help'} details={modalDetails} removedby={removedby}>
        <span title={meta.desc} data-removedby={removedby} className='removedby'>{orphaned_label+(meta.label || '')+withinText+details} <QuestionMark fill={fill}/></span>
      </LabelWithModal>
  }
  if (locked) {
    lockedTag =
      <LabelWithModal hash='action_locked_help'>
        <span className='lockedTag'>locked <QuestionMark fill='black'/></span>
      </LabelWithModal>
  }
  if (allActionsExceptLocked || lockedTag) {
    displayTag =
      <div style={style}>
        {allActionsExceptLocked}
        {lockedTag}
        {temporarilyVisible}
      </div>
  }
  return displayTag
}

export const LabelWithModal = ({children, hash, content, details, removedby, marginRight = '5px'}) => {
  const modal = React.useContext(ModalContext)
  const modalContent = {}
  if (details && removedby) {
    modalContent.content = <><ActionHelp action={removedby}/><p>{details}</p></>
  } else if (content) {
    modalContent.content = content
  } else {
    modalContent.hash = hash
  }
  let label = children
  if (! label) {
    label = <span className='removedby'>{ALL_ACTIONS_META[removedby].label} <QuestionMark/></span>
  }
  return (
    <a className='pointer' onClick={() => modal.openModal(modalContent)} style={{marginRight}}>
      {label}
    </a>
  )
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
