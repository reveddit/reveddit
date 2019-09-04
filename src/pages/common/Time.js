import React from 'react'
import { connect } from 'state'
import { getPrettyDate } from 'utils'

class Time extends React.Component {

  render() {
    var localTime = new Date(0)
    const { showDate, pretty, created_utc } = this.props
    let displayTime = ''
    if (created_utc) localTime.setUTCSeconds(created_utc)
    if (showDate) {
      displayTime = localTime.toISOString().slice(0, 10).replace(/-/g,'/')
    } else if (pretty) {
      displayTime = pretty
    } else {

      displayTime = getPrettyDate(created_utc)
    }
    return <span title={localTime} dateTime={localTime} className='time'>{displayTime}</span>
  }
}

export default Time
