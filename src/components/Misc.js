import React from 'react'
import {www_reddit} from 'api/reddit'

export const Spin = ({width}) => {
  const spin = <img className='spin' width={width} src='/images/spin.gif'/>
  if (! width) {
    return <div className='non-item'>{spin}</div>
  }
  return spin
}

export const MessageMods = ({permalink, subreddit}) => {
  const mods_message_body = '\n\n\n'+www_reddit+permalink
  const mods_link = www_reddit+'/message/compose?to=/r/'+subreddit+'&message='+encodeURI(mods_message_body)
  return <a href={mods_link} target="_blank">message mods</a>
}
