import React from 'react'
import { connect } from 'state'
import { getPrettyDate } from 'utils'

class Time extends React.Component {

  render() {
    var localTime = new Date(0)
    localTime.setUTCSeconds(this.props.created_utc)
    const { showDate } = this.props
    let displayTime = ''
    if (showDate) {
      displayTime = localTime.toISOString().slice(0, 10).replace(/-/g,'/')
    } else {
      displayTime = getPrettyDate(this.props.created_utc)
    }
    return <span title={localTime} dateTime={localTime} className='time'>{displayTime}</span>
  }
}

export default Time
