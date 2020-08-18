import React from 'react'
import { markdownToHTML, commentIsRemoved, replaceAmpGTLT,
         commentIsOrphaned, commentIsMissingInThread, get, put,
         getRemovedMessage, textSaysRemoved, getRemovedWithinText } from 'utils'
import { connect } from 'state'
import Notice from 'pages/common/Notice'
import FindCommentViaAuthors from 'data_processing/FindCommentViaAuthors'

const notices = {
  'orphaned': 'hideOrphanedNotice',
  'missing': 'hideMissingInThreadNotice',
}

const dismiss = (noticeType) => {
  put(notices[noticeType], true)
  for (let el of document.querySelectorAll(`.comment .notice-with-link.${noticeType}`)) {
    el.style.display = 'none'
  }
}

const CommentBody = (props) => {
  let innerHTML = '', actionDescription = '', searchAuthorsForm = ''
  const isThread = props.page_type === 'thread'
  const comment_Is_Removed = commentIsRemoved(props)
  if (! props.deleted) {
    if ( (comment_Is_Removed || (isThread && props.archive_body_removed))
         && props.removed) {
      innerHTML = '<p>'+getRemovedMessage(props, 'comment')+'</p>'
      if (isThread) {
        if (comment_Is_Removed) {
          searchAuthorsForm = <FindCommentViaAuthors {...props}/>
        } else if (props.archive_body_removed) { // explicit for clarity, could be else { w/no condition
          innerHTML = `[removed ${getRemovedWithinText(props)}, restored via user page]`+markdownToHTML(props.body)
        }
      }
    } else {
      if (props.page_type === 'user' && ! props.removed) {
        if (commentIsMissingInThread(props)) {
          if (! get(notices.missing, false)) {
            actionDescription = <Notice className='missing' title='missing'
              message={<div>Due to a <a href='https://www.reddit.com/gwzbv0'>rare bug in reddit</a>, this comment is missing in its thread. Click the reddit-parent link below to confirm this comment does not appear.</div>}
              dismissFn={() => dismiss('missing')}/>
          }
        } else if (commentIsOrphaned(props) && ! get(notices.orphaned, false)) {
          actionDescription = <Notice className='orphaned' title='orphaned'
            message='This comment is not removed. It is less visible because the parent comment or link itself was removed.'
            dismissFn={() => dismiss('orphaned')} />
        }
      }
      innerHTML = markdownToHTML(props.body)
    }
  } else {
    innerHTML = '<p>[deleted by user]</p>'
  }

  return (
    <div className='comment-body'>
      {actionDescription}
      <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
      {searchAuthorsForm}
    </div>
  )
}

export default connect(CommentBody)
