import React from 'react'
import { parse, commentIsRemoved, replaceAmpGTLT, getPrettyTimeLength } from 'utils'
import { connect } from 'state'

const CommentBody = (props) => {
  let innerHTML = ''
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
      innerHTML = parse(replaceAmpGTLT(props.body))
    }
  }

  return (
    <div className='comment-body' dangerouslySetInnerHTML={{ __html: innerHTML }} />
  )
}

export default connect(CommentBody)
