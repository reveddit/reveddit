import React from 'react'
import {ext_urls} from 'utils'
import { Link }from 'react-router-dom'

export default () => {
  const extension_link = <Link to='/add-ons/'>reveddit extension</Link>
  return (
    <div className='note highlight real-time desktop-only'>
      The free {extension_link} is required to receive <span className='red bubble'>alerts</span> and view <span className='quarantined'>quarantined</span> content.
    </div>
  )
}
