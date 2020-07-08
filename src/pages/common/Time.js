import React from 'react'
import { connect } from 'state'
import { getPrettyDate, getPrettyTimeLength } from 'utils'
import {showRelDates_global} from 'pages/common/Settings'

export default ({ showDate, pretty, created_utc, edited, global, name, parent_id, page_type, noAgo=false }) => {
  var localTime = new Date(0)
  let displayTime = '', edited_text = ''
  if (created_utc) localTime.setUTCSeconds(created_utc)
  if (showDate) {
    displayTime = localTime.toISOString().slice(0, 10).replace(/-/g,'/')
  } else if (pretty) {
    displayTime = pretty
  } else if (page_type === 'thread' && showRelDates_global && global && parent_id) {
    const parent_kind = parent_id.slice(0,2)
    let parent
    if (parent_kind === 't1') {
      parent = global.state.itemsLookup[parent_id.substr(3)]
    } else if (parent_kind === 't3') {
      parent = global.state.threadPost
    }
    if (parent && parent.created_utc) {
      displayTime = getPrettyTimeLength(created_utc-parent.created_utc)+' later ('+getPrettyDate(created_utc)+')'
    }
  }
  if (! displayTime) {
    displayTime = getPrettyDate(created_utc, noAgo)
  }
  if (edited) {
    var edited_localTime = new Date(0)
    edited_localTime.setUTCSeconds(edited)
    const edited_displayTime = getPrettyTimeLength(edited-created_utc)
    edited_text = <span title={edited_localTime} dateTime={edited_localTime} className='time'>* (edited {edited_displayTime} after)</span>
  }
  return <span title={localTime} dateTime={localTime} className='time'>{displayTime}{edited_text}</span>
}
