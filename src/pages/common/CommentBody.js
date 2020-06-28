import React from 'react'
import { parse, commentIsRemoved, replaceAmpGTLT, getPrettyTimeLength,
         commentIsOrphaned, commentIsMissingInThread, get, put } from 'utils'
import { connect } from 'state'
import Notice from 'pages/common/Notice'

const notices = {
  'orphaned': 'hideOrphanedNotice',
  'missing': 'hideMissingInThreadNotice',
}
const dismissText = '✖'
const dismiss = (noticeType) => {
  put(notices[noticeType], true)
  for (let el of document.querySelectorAll(`.comment .notice-with-link.${noticeType}`)) {
    el.style.display = 'none'
  }
}

const CommentBody = (props) => {
  let innerHTML = '', note = ''
  if (! props.deleted) {
    if (commentIsRemoved(props) && props.removed) {
      let removedMessage = 'too quickly to be archived'
      if (props.retrieved_on) {
        removedMessage = 'before archival, within '+getPrettyTimeLength(props.retrieved_on-props.created_utc)
      } else if (props.global.state.loading) {
        removedMessage = 'content loading...'
      }
      innerHTML = `<p>[removed ${removedMessage}]</p>`
    } else {
      if (props.page_type === 'user' && ! props.removed) {
        if (commentIsMissingInThread(props)) {
          if (! get(notices.missing, false)) {
            note = <Notice className='missing' title='missing'
              message={<div>Due to a <a href='https://www.reddit.com/gwzbv0'>rare bug in reddit</a>, this comment is missing in its thread. Click the reddit-parent link below to confirm this comment does not appear.</div>}
              dismissFn={() => dismiss('missing')}/>
          }
        } else if (commentIsOrphaned(props) && ! get(notices.orphaned, false)) {
          note = <Notice className='orphaned' title='orphaned'
            message='This comment is not removed. It is less visible because the parent comment or link itself was removed.'
            dismissFn={() => dismiss('orphaned')} />
        }
      }
      innerHTML = parse(replaceAmpGTLT(props.body))
    }
  } else {
    innerHTML = '<p>[deleted by user]</p>'
  }

  return (
    <div className='comment-body'>
      {note}
      <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
    </div>
  )
}

export default connect(CommentBody)
