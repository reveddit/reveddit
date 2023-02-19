import React from 'react'
import {itemIsCollapsed, commentIsMissingInThread,
        isPost, getRemovedWithinText, postRemovedUnknownWithin,
        commentIsRemoved, getPrettyTimeLength,
} from 'utils'
import ModalContext from 'contexts/modal'
import {QuestionMark} from 'pages/common/svg'
import ActionHelp from 'pages/modals/ActionHelp'
import {modlogSaysBotRemoved} from 'data_processing/comments'
import {LinkWithCloseModal, NewWindowLink} from 'components/Misc'

const APPROVED = 'approved'
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

const faq = '/about/faq/'

export const unarchived_label_text = 'restored via user page'
const AUTOMOD_LINK = <NewWindowLink reddit='/wiki/automoderator'>automod</NewWindowLink>
const SPAM_FILTER_LINK = <NewWindowLink reddit='/r/modnews/comments/6bj5de/state_of_spam/'>spam filter</NewWindowLink>
const CROWD_CONTROL_LINK = <NewWindowLink reddit='/r/reveddit/comments/qi1r55/fyi_crowd_control_can_now_remove_comments/higolif/'>crowd control</NewWindowLink>
const REVEDDIT_POST_ON_ADMIN_REMOVED_CONTENT = '/r/reveddit/comments/w8i11a/good_news_admins_are_being_more_transparent_by/'

const arma_custom = (label) => {
  return `[approved] ${label}-removed, then approved`
}

const LABEL_SPAM_REMOVED_THEN_APPROVED = arma_custom('spam')

export const REMOVAL_META = {
                 [ANTI_EVIL_REMOVED]: {filter_text: 'admin removed',
                                         label: '[removed] by Reddit',
                                          desc: <>Removed by a Reddit admin. <NewWindowLink reddit='/9qf5ma'>More info</NewWindowLink><p>See also: <NewWindowLink reddit={REVEDDIT_POST_ON_ADMIN_REMOVED_CONTENT}>Good news: Admins are being more transparent by labeling the content they remove. Bad news: Reveddit won't show this content.</NewWindowLink></p></>,
                                      },
        [MOD_OR_AUTOMOD_REMOVED]: {filter_text: 'mod removed',
                                         label: '[removed] by mod',
                                          desc: 'Likely removed by a moderator. There is also a chance it was removed automatically.',
                                   reddit_link: '/fifhp7'},
               [AUTOMOD_REMOVED]: {filter_text: 'auto-removed',
                                         label: '[removed] automatically',
                                          desc: "Likely removed by a bot such as automod or reddit's spam filter.",
                                      jsx_desc: <>Likely removed by a bot such as {AUTOMOD_LINK}, or reddit's {CROWD_CONTROL_LINK} or {SPAM_FILTER_LINK}.</>},
  [AUTOMOD_REMOVED_MOD_APPROVED]: {filter_text: 'auto-removed -> approved',
                                         label: arma_custom('auto'),
                                          desc: 'This content was initially auto-removed and later manually approved by a moderator.',
                                      jsx_link: <>See {AUTOMOD_LINK} and {SPAM_FILTER_LINK}</>},
               [UNKNOWN_REMOVED]: {filter_text: 'unknown removed',
                                         label: '[removed] unknown if mod/auto',
                                          desc: 'Cannot say with certainty whether this was removed by a mod or by a bot.',
                                    local_link: faq+'#unknown-removed'},
                        [LOCKED]: {filter_text: 'locked',
                                         label: 'locked',
                                          desc: 'locked, replies are not permitted.',
                                   reddit_link: '/brgr8i'}
                            }

const APPROVED_META = {
  filter_text: 'approved',
        label: 'approved',
         desc: 'The content was approved by a moderator.',
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
                                         desc: 'The author of this content deleted it.',
                                  reddit_link: '/r/removeddit/comments/ir1oyw/_/g5fgxgl/?context=3#thing_t1_g5fgxgl'}

export const RESTORED_META = {filter_text: unarchived_label_text,
                                    label: unarchived_label_text,
                                     desc: "This comment or edit was not archived but could be copied from the author's /user page on reddit.",
                              local_link: '/about/faq/#restore'}

export const ALL_ACTIONS_META = {
  ...REMOVAL_META,
  [COLLAPSED]: COLLAPSED_META,
  [MISSING_IN_THREAD]: MISSING_IN_THREAD_META,
  [ORPHANED]: ORPHANED_META,
  [USER_REMOVED]: USER_REMOVED_META,
  [RESTORED]: RESTORED_META,
  [APPROVED]: APPROVED_META,
}

// This should only contain keys that do not signify user deletion
// That is, do not add 'deleted'
export const USER_DELETED_BUT_FIRST_REMOVED_BY = {
  'reddit': 'spam',
  'automod_filtered': 'auto',
  'moderator': 'mod',
  'anti_evil_ops': 'admin-ae',
  'community_ops': 'admin-co',
  'legal_operations': 'admin-lo',
}

export const preserve_desc = <><b>preserve:</b> This attempts to lookup and store the location of the comment in the URL and copies the new URL to the clipboard. If the lookup succeeds and the comment is later removed by a moderator, or if the archive becomes unavailable, then it can be viewed with this URL.<br/><br/>The lookup succeeds if the comment can be found in the user's most recent 100 comments. Otherwise, it may be found via the context link on their reveddit user page.</>
const temp_vis_txt = 'Temporarily visible'
const temp_vis_until = <>here until it falls out of the most recent mod log items. To save it, click {preserve_desc}</>
const temp_vis_help = (<>
  <h3>{temp_vis_txt}</h3>
  <p>This comment is only visible {temp_vis_until}</p>
</>)

const ModlogDetails = ({modlog, text, created_utc}) => {
  const prettyTimeLength = getPrettyTimeLength(modlog.created_utc-created_utc)
  const detailsText = (modlog.details && modlog.details !== 'remove') ? modlog.details
                    : modlog.action.includes('spam') ? 'Spam' : ''
  return (
    <>
      <h4>Details from <LinkWithCloseModal to='/about/faq/#removal-reason'>mod logs</LinkWithCloseModal></h4>
      <ul>
        <li>{text+' '+prettyTimeLength+' after creation '}</li>
        <li>Mod: {modlog.mod}</li>
        {detailsText &&
          <li>Details: {detailsText}</li> }
      </ul>
    </>
  )
}

const RemovedBy = (props) => {
  let displayTag = '', details = '', meta = undefined, withinText = '', fill = undefined,
      allActionsExceptLockedAndEvil = '', lockedTag = '', temporarilyVisible = '', alternateLabel = '',
      evilTag = ''
  let {removedby, orphaned_label = '', style,
       locked, removed, deleted, modlog, name, permalink,
       removed_by_category, removal_reason, selftext_said_removed, archived_removed_by_category,
      } = props
  const first_removed_by_other = USER_DELETED_BUT_FIRST_REMOVED_BY[archived_removed_by_category]
  const is_post = name && isPost(props)
  if (removed && ! removedby && ! removal_reason) {
    removedby = UNKNOWN_REMOVED
  }
  if (removedby === ORPHANED) {
    meta = ORPHANED_META
    orphaned_label = '[orphaned] '+orphaned_label
  } else if (removedby && removedby !== NOT_REMOVED && removedby !== USER_REMOVED) {
    meta = REMOVAL_META[removedby]
    if (removedby === UNKNOWN_REMOVED && is_post &&
        postRemovedUnknownWithin(props)) {
      withinText = ','+getRemovedWithinText(props)
    }
    if (removed && modlog) {
      if (props.archive_body_removed_before_modlog_copy
                 && modlog.log_source !== 'u_modlogs'
                 && ! props.also_in_add_user) {
        temporarilyVisible =
          <LabelWithModal content={temp_vis_help}>
            <span title={temp_vis_txt} className='removedby'>temporarily visible <QuestionMark/></span>
          </LabelWithModal>
      }
      if (modlog.mod && ! modlogSaysBotRemoved(modlog, props)) {
        details += ` u/${modlog.mod}`
      }
      if (modlog.details && modlog.details !== 'remove') {
        details += ' | ' + modlog.details
      }
    }
    if (! details && removed_by_category === 'reddit') {
      alternateLabel = '[removed] by reddit (spam)'
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
  } else if (modlog && removedby == NOT_REMOVED) {
    meta = APPROVED_META
    removedby = APPROVED
  }
  if ([AUTOMOD_REMOVED_MOD_APPROVED,APPROVED].includes(removedby)) {
    fill = 'white'
    if (removedby === AUTOMOD_REMOVED_MOD_APPROVED && archived_removed_by_category === 'reddit') {
      alternateLabel = LABEL_SPAM_REMOVED_THEN_APPROVED
    }
  }
  if (meta) {
    const modalDetailsItems = []
    if (removed) {
      if (modlog) {
        modalDetailsItems.push( <ModlogDetails {...props} modlog={modlog} text='Removed'/> )
        if (temporarilyVisible) {
          modalDetailsItems.push(<p>{temp_vis_txt} {temp_vis_until}</p>)
        }
      } else if (props.retrieved_on) {
        const prettyTimeLength = getPrettyTimeLength(props.retrieved_on-props.created_utc)
        const removedWithinText = 'Removed within '+prettyTimeLength
        if ( (! is_post && ! commentIsRemoved(props) && ! props.from_add_user)
             || (is_post && removedby === MOD_OR_AUTOMOD_REMOVED)) {
          // a comment or post that was removed after archival
          // comment criteria: removed, no mod log, is a comment, body exists, and not restored from add_user logic
          modalDetailsItems.push('Removed after archival. Archived '+prettyTimeLength+' after creation.')
        } else if (   (is_post && [AUTOMOD_REMOVED, AUTOMOD_REMOVED_MOD_APPROVED].includes(removedby))
                   || (! is_post && commentIsRemoved(props))) {
          modalDetailsItems.push(removedWithinText)
          if (is_post && removedby === AUTOMOD_REMOVED && archived_removed_by_category === 'reddit' && removed_by_category !== archived_removed_by_category) {
            details +=' (spam)'
            if (removed_by_category) {
              modalDetailsItems.push(<p>Originally removed by Reddit's spam filter, later marked as removed by: {removed_by_category}</p>)
            }
          }
        }
      }
    } else if (removedby === APPROVED) {
      modalDetailsItems.push( <ModlogDetails {...props} modlog={modlog} text='Approved'/> )
    } else if (deleted && is_post && (selftext_said_removed || first_removed_by_other)) {
      alternateLabel = `[deleted] by ${first_removed_by_other || 'mod'} & user`
      modalDetailsItems.push(
        <p>It was originally removed by {archived_removed_by_category || 'a moderator'}. <NewWindowLink reddit={permalink} redesign={true}>New reddit</NewWindowLink> may show more details.</p>)
    }
    if (removed_by_category === 'reddit') {
      modalDetailsItems.push(<p>The author was likely not notified of the removal. See <LinkWithCloseModal to='/about/faq/#reddit-does-not-say-post-removed'>Why didn't Reddit tell me my post was removed?</LinkWithCloseModal></p>)
    }
    if (props.wayback_path) {
      modalDetailsItems.push(<p>source: <NewWindowLink href={'https://web.archive.org'+props.wayback_path}>Wayback Machine</NewWindowLink></p>)
    }
    const modalDetails = modalDetailsItems.map((x, i) => <div key={i}>{x}</div>)
    allActionsExceptLockedAndEvil =
      <LabelWithModal hash={'action_'+removedby+'_help'} details={modalDetails} removedby={removedby}>
        <span title={meta.desc} data-removedby={removedby} className='removedby'>{orphaned_label+(alternateLabel || meta.label || '')+withinText+details} <QuestionMark fill={fill}/></span>
      </LabelWithModal>
  }
  if (locked) {
    lockedTag =
      <LabelWithModal hash='action_locked_help'>
        <span className='lockedTag'>locked <QuestionMark fill='black'/></span>
      </LabelWithModal>
  }
  if (removal_reason) {
    const evil_meta = REMOVAL_META[ANTI_EVIL_REMOVED]
    evilTag =
      <LabelWithModal hash={'action_'+ANTI_EVIL_REMOVED+'_help'}>
        <span title={evil_meta.desc} data-removedby={ANTI_EVIL_REMOVED} className='removedby'>{evil_meta.label} {removal_reason} <QuestionMark/></span>
      </LabelWithModal>
  }

  if (allActionsExceptLockedAndEvil || lockedTag || evilTag) {
    displayTag =
      <div style={style}>
        {allActionsExceptLockedAndEvil}
        {lockedTag}
        {evilTag}
        {temporarilyVisible}
      </div>
  }
  return displayTag
}

export const LabelWithModal = ({children, hash, content, details, removedby, marginRight = '5px'}) => {
  const modal = React.useContext(ModalContext)
  const modalContent = {}
  if (details && removedby) {
    modalContent.content = <><ActionHelp action={removedby}/><div style={{margin: '16px 0'}}>{details}</div></>
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
