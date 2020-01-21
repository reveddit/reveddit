import React from 'react'
import { parse, isRemoved, replaceAmpGTLT, getPrettyTimeLength } from 'utils'

export default (props) => {
  let innerHTML = ''
  if (! props.deleted) {
    if (isRemoved(props.body) && props.removed) {
      let removedMessage = 'too quickly to be archived'
      if (props.retrieved_on) {
        removedMessage = 'within '+getPrettyTimeLength(props.retrieved_on-props.created_utc)
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
