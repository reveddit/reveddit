import React from 'react'
import Time from 'pages/common/Time'
import { prettyScore, roundToX, replaceAmpGTLT } from 'utils'

class PostPreview extends React.Component {
  render() {
    const props = this.props
    const title = props.title ?
      replaceAmpGTLT(props.title) : ''

    return (
      <div id={props.name} className='post preview'>
        <div className='rate'>{roundToX(props.rate*100,1)}%</div>
        <div>
          <div>
            <a className='title' href='#'>{title}</a>
          </div>
          <div>
            <span className='score spaceRight'>{prettyScore(props.score)} points</span>
            <Time className='spaceRight' created_utc={props.last_created_utc}/>
            {props.num_comments ?
              <span className='score'>{props.num_comments} comments</span>
              : ''
            }
          </div>
        </div>
      </div>
    )
  }
}
export default PostPreview
