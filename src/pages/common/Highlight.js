import React from 'react'
import {ext_urls} from 'utils'
import ModalContext from 'contexts/modal'


export default () => {
  const {openModal} = React.useContext(ModalContext)
  const extension_link = <a className='pointer' onClick={() => openModal({'hash': 'welcome'})}>reveddit extension</a>
  if (! window.navigator.language.match(/^en\b/)) {
    return (
      <div className='note highlight real-time'>
        <span className='red bubble' style={{'padding': '0 5px'}}>!</span> The {extension_link} may be required to view removed content when the browser or OS language is not English (see details <a target="_blank" href="https://redd.it/d4wtes">here</a>).
      </div>
    )
  } else {
    return (
      <div className='note highlight real-time desktop-only'>
        The free {extension_link} is required to receive <span className='red bubble'>alerts</span> and view <span className='quarantined'>quarantined</span> content.
      </div>
    )
  }
}
