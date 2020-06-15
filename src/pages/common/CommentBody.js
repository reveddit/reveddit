import React from 'react'
import { parse, commentIsRemoved, replaceAmpGTLT, getPrettyTimeLength,
         commentIsOrphaned, get, put } from 'utils'
import { connect } from 'state'
import Notice from 'pages/common/Notice'

const hideOrphanedNotice_var = 'hideOrphanedNotice'

const dismiss = () => {
  put(hideOrphanedNotice_var, true)
  for (let el of document.querySelectorAll('.comment .notice-with-link')) {
    el.style.display = 'none'
  }
}

const CommentBody = (props) => {
  let innerHTML = '', orphanedNote = ''
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
      if (! props.removed && commentIsOrphaned(props) && ! get(hideOrphanedNotice_var, false)) {
        orphanedNote = <Notice title='orphaned comment'
          message='This comment is not removed. It is less visible because the parent comment or link itself was removed.'
          htmlLink={<a className="pointer" onClick={() => dismiss()}>dismiss this reveddit notice</a>} />
      }
      innerHTML = parse(replaceAmpGTLT(props.body))
    }
  } else {
    innerHTML = '<p>[deleted by user]</p>'
  }

  return (
    <div className='comment-body'>
      {orphanedNote}
      <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
    </div>
  )
}

export default connect(CommentBody)
