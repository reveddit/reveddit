import React from 'react'
import {ext_urls} from 'utils'
import {ExtensionLink} from 'components/Misc'

export default ({showMobile = false}) => {
  return (
    <div className={`note highlight real-time ${showMobile ? '' : 'desktop-only'}`}>
      <span className='quarantined'>Tip</span> <ExtensionLink/> can notify you when your content is removed.
    </div>
  )
}
