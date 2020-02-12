import React from 'react'
import { connect } from 'state'
import { getPrettyDate, getPrettyTimeLength } from 'utils'

export default ({ showDate, pretty, created_utc, edited }) => {
  var localTime = new Date(0)
  let displayTime = '', edited_text = ''
  if (created_utc) localTime.setUTCSeconds(created_utc)
  if (showDate) {
    displayTime = localTime.toISOString().slice(0, 10).replace(/-/g,'/')
  } else if (pretty) {
    displayTime = pretty
  } else {
    displayTime = getPrettyDate(created_utc)
  }
  if (edited) {
    var edited_localTime = new Date(0)
    edited_localTime.setUTCSeconds(edited)
    const edited_displayTime = getPrettyTimeLength(edited-created_utc)
    edited_text = <span title={edited_localTime} dateTime={edited_localTime} className='time'>* (edited {edited_displayTime} later)</span>
  }
  return <span title={localTime} dateTime={localTime} className='time'>{displayTime}{edited_text}</span>
}
