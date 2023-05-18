import React from 'react'
import { markdownToHTML, commentIsRemoved,
         commentIsOrphaned, commentIsMissingInThread, get, put,
         getRemovedMessage, textSaysRemoved, getRemovedWithinText, commentRemovedByReddit } from 'utils'
import { connect } from 'state'
import {Notice} from 'pages/common/Notice'
import RestoreComment, {HideUnarchivedComments} from 'data_processing/RestoreComment'
import { NewWindowLink } from 'components/Misc'
import {LabelWithModal, RESTORED} from 'pages/common/RemovedBy'
import {QuestionMark} from 'pages/common/svg'


const notices = {
  'orphaned': 'hideOrphanedNotice',
  'missing': 'hideMissingInThreadNotice',
  'context': 'hideContextInThreadNotice',
}

const dismiss = (noticeType) => {
  put(notices[noticeType], true)
  for (let el of document.querySelectorAll(`.comment .notice-with-link.${noticeType}`)) {
    el.style.display = 'none'
  }
}
const submitUsername = (e) => {
  e.preventDefault()
  const data = new FormData(e.target)
  const username = data.get('username').trim().replace(/^u(?:ser)?\//i, '')
  if (username) {
    window.open(`/u/${username}?all=true`, '_blank').focus()
  }
}
const hasVisitedUserPage = get('hasVisitedUserPage', null)
let usernameEntry = <></>
if (! hasVisitedUserPage) {
  usernameEntry = <div className='user-lookup'>
    <form onSubmit={submitUsername}>
      <input type='text' placeholder='username' name='username'/>
      <input type='submit' value='go' />
      <span> (check your username's removed content. <a href='/about/faq/#need' target='_blank'>why?</a>)</span>
    </form>
  </div>
}

const CommentBody = (props) => {
  let innerHTML = '', actionDescription = '', searchAuthorsForm = '', restoredTag = '', hideUnarchivedButton = '',
      removedMessage = <></>
  const isThread = props.page_type === 'thread'
  const comment_Is_Removed = commentIsRemoved(props) || commentRemovedByReddit(props)
  if (! props.deleted) {
    const archiveRemoved_or_noArchive_or_fromAddUser = (props.archive_body_removed || ! props.archive_processed || props.from_add_user) && ! props.removal_reason
    if ( (comment_Is_Removed || (isThread && archiveRemoved_or_noArchive_or_fromAddUser))
         && props.removed) {
      if (isThread) {
        if (comment_Is_Removed) {
          searchAuthorsForm = <RestoreComment {...props}/>
        } else if (archiveRemoved_or_noArchive_or_fromAddUser) { // explicit for clarity, could be else { w/no condition
          const within = props.archive_body_removed ? getRemovedWithinText(props) : ''
          restoredTag = (
            <LabelWithModal hash='action_restored_help' removedby={RESTORED} details={within ? 'removed'+within : ''}/>
          )
          innerHTML = markdownToHTML(props.body)
        }
      }
      if (! innerHTML) {
        if (!isThread && props.removal_reason) {
          innerHTML = markdownToHTML(props.body)
        } else {
          removedMessage = <><p>{getRemovedMessage(props, 'comment')}</p>{usernameEntry}</>
        }
      }
      if (comment_Is_Removed && ! searchAuthorsForm) {
        hideUnarchivedButton = <HideUnarchivedComments global={props.global} page_type={props.page_type}/>
      }
    } else {
      if (props.page_type === 'user') {
        if (! props.removed) {
          if (commentIsMissingInThread(props)) {
            if (! get(notices.missing, false)) {
              actionDescription = <Notice className='missing' title='missing'
                message={<div>Due to a <NewWindowLink reddit={'/gwzbv0'}>rare bug in reddit</NewWindowLink>, this comment is missing in its thread. Click the reddit-parent link below to confirm this comment does not appear.</div>}
                dismissFn={() => dismiss('missing')}/>
            }
          } else if (commentIsOrphaned(props) && ! get(notices.orphaned, false)) {
            actionDescription = <Notice className='orphaned' title='orphaned'
              message='This comment is not removed. It is less visible because the parent comment or link itself was removed.'
              dismissFn={() => dismiss('orphaned')} />
          }
        } else if (! props.removal_reason && ! get(notices.context, false)) {
          actionDescription = <Notice className='context' title='show comments in context'
            message="The 'context' and 'full comments' links below can show this comment in its thread's context."
            dismissFn={() => dismiss('context')} />
        }
      }
      innerHTML = markdownToHTML(props.body)
    }
  } else {
    removedMessage = usernameEntry
  }

  return (
    <div className='comment-body'>
      {actionDescription}
      {restoredTag}
      <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
      {removedMessage}
      {searchAuthorsForm}
      {hideUnarchivedButton}
    </div>
  )
}

export default connect(CommentBody)
