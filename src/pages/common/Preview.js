import React from 'react'
import Time from 'pages/common/Time'
import { prettyScore, roundToX, replaceAmpGTLT } from 'utils'
import { www_reddit } from 'api/reddit'

const COMMENTS = 'comments'
const POSTS = 'posts'

const Preview = ({
  body, title, rate, score, subreddit,
  id_of_max_pos_removed_item: id, link_id_of_max_pos_removed_item: link_id,
  last_created_utc, type, num_comments,
  periodUrl,
}) => {
  const body_render = body ?
    <div className='comment-body'><p>{replaceAmpGTLT(body)}</p></div> : null
  const title_render = title ?
    replaceAmpGTLT(title) : ''
  const isPost = type === POSTS
  let link_path, link_text
  if (isPost) {
    link_path = `/r/${subreddit}/comments/${id}`
    link_text = num_comments+' comments'
  } else {
    link_path = `/r/${subreddit}/comments/${link_id}/_/${id}/?context=3#t1_${id}`
    link_text = 'context'
  }
  return (
    <div id={id} className={'preview '+type.slice(0,-1)}>
      <div className='rate'>{roundToX(rate*100,1)}%</div>
      <div>
        <div className='title'>{title_render}</div>
        <div>
          <span className='score spaceRight'>{prettyScore(score)} point{(score !== 1) && 's'}</span>
          <Time className='spaceRight' created_utc={last_created_utc}/>
          {! periodUrl && isPost && <span className='score'>{num_comments} comments</span>}
        </div>
        {body_render}
        {periodUrl ?
          <div className='links'>
            <a className='spaceRightLarge' href={link_path}>{link_text}</a>
            <a className='spaceRightLarge' href={www_reddit+link_path}>reddit</a>
            <a href={periodUrl}>period</a>
          </div>
          : null
        }
      </div>
    </div>
  )
}

export default Preview
