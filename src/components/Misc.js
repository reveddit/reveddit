import React from 'react'
import {www_reddit} from 'api/reddit'
import { QuestionMark } from 'pages/common/svg'
import ModalContext from 'contexts/modal'

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

export const QuestionMarkModal = ({modalContent}) => {
  const modal = React.useContext(ModalContext)
  return (
    <a className='pointer' onClick={() => modal.openModal(modalContent)}>
      <QuestionMark style={{marginLeft: '10px'}} wh='20'/>
    </a>
  )
}
