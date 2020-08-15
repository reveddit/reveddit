import React from 'react'
import { prettyScore, roundToX, replaceAmpGTLT } from 'utils'
import Time from 'pages/common/Time'

class CommentPreview extends React.Component {
  render() {
    const props = this.props
    const body = props.body ?
      replaceAmpGTLT(props.body) : ''

    return (
      <div id={props.name} className='comment preview'>
        <div className='rate'>{roundToX(props.rate*100,1)}%</div>
        <div className='comment-head-and-body'>
          <div className='comment-head'>
            <a
              href='#'
              className='title'
            >
            {props.title}
            </a>
          </div>
          <div className='comment-head subhead'>
            <span className='comment-score spaceRight'>{prettyScore(props.score)} point{(props.score !== 1) && 's'}</span>
            <Time created_utc={props.last_created_utc}/>
          </div>
          <div className='comment-body-and-links'>
            <div className='comment-body'>
              {body}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default CommentPreview
