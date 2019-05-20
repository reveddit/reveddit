import React from 'react'
import Time from 'pages/common/Time'
import { prettyScore, roundToX } from 'utils'

class PostPreview extends React.Component {
  render() {
    const props = this.props
    const title = props.title ?
      props.title.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
      : ''

    return (
      <div id={props.name} className='post preview'>
        <div className='rate'>{roundToX(props.rate*100,1)}%</div>
        <div>
          <div>
            <a className='title' href='#'>{title}</a>
          </div>
          <div>
            <span className='score'>{prettyScore(props.score)} points</span>
            <span className='space' />
            <Time created_utc={props.last_created_utc}/>
            <span className='space' />
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
