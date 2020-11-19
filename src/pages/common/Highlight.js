import React from 'react'
import {ext_urls} from 'utils'
import { Link }from 'react-router-dom'

export default () => {
  return (
    <div className='note highlight real-time desktop-only'>
      <span className='quarantined'>Tip</span> <Link to='/add-ons/'>Reveddit Real-Time</Link> can notify you when your content is removed.
    </div>
  )
}
