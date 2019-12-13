import React from 'react'
import {ext_urls} from 'utils'

export default () => {
  return (
    <>
      <p><span className="red bubble">new!</span> receive notifications when content is removed with the real-time extension:</p>
      <div className='space-around'>
        <a className='white' href={ext_urls.rt.c}><div className="red button bubble big">Add to Chrome</div></a>
        <a className='white' href={ext_urls.rt.f}><div className="red button bubble big">Add to Firefox</div></a>
      </div>
      <p><img className='desktop-only' src='/images/screenshot-notification-small.png'/></p>
      <p>This message can be re-opened by clicking <i>welcome</i> at the top of any page.</p>
    </>
  )
}
