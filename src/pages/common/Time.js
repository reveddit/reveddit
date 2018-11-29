import React from 'react'
import { connect } from 'state'

class Time extends React.Component {
  finePrettyDate(createdUTC) {
    const seconds = Math.floor((new Date).getTime()/1000)-createdUTC
    const thresholds = [[60, 'second', 'seconds'], [60, 'minute', 'minutes'], [24, 'hour', 'hours'], [7, 'day', 'days'],
                     [365/12/7, 'week', 'weeks'], [12, 'month', 'months'], [10, 'year', 'years'],
                     [10, 'decade', 'decades'], [10, 'century', 'centuries'], [10, 'millenium', 'millenia']];
    if (seconds < 60) return seconds + ' seconds ago';
    let time = seconds;
    for (var i=0; i<thresholds.length; i++) {
      let divisor = thresholds[i][0];
      let text = thresholds[i][1];
      let textPlural = thresholds[i][2];
      if (time < divisor) {
        let extra = (time - Math.floor(time));
        let prevUnitTime = Math.round(extra*thresholds[i-1][0]);
        if (Math.floor(time) > 1 || Math.floor(time) == 0) {
          text = textPlural;
        }
        if (i > 1 && prevUnitTime > 0) {
          let remainText = thresholds[i-1][1];
          if (prevUnitTime > 1) {
            remainText = thresholds[i-1][2];
          }
          text += ', ' + String(prevUnitTime) + ' ' + remainText;
        }
        return String(Math.floor(time)) + ' ' + text + ' ago';
      }
      time = time / divisor;
    }
  }

  render() {
    var localTime = new Date(0);
    localTime.setUTCSeconds(this.props.created_utc);

    return <span title={localTime} dateTime={localTime} className='time'>{this.finePrettyDate(this.props.created_utc)}</span>
  }
}

export default Time
