import React from 'react'
import {ext_urls} from 'utils'
import ModalContext from 'contexts/modal'

export default () => {
  const {openModal} = React.useContext(ModalContext)
  return (
    <div className='note highlight real-time'>
      <span className='red bubble'>new!</span> Install the <a className='pointer' onClick={() => openModal({'hash': 'welcome'})}>real-time extension</a> to be notified of removed content.
    </div>
  )
}
