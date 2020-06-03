import React from 'react'
import {ext_urls} from 'utils'
import { Link }from 'react-router-dom'

export default () => {
  const extension_link = <Link to='/add-ons/'>reveddit extension</Link>
  if (! window.navigator.language.match(/^en\b/)) {
    return (
      <div className='note highlight real-time'>
        <span className='red bubble' style={{'padding': '0 5px'}}>!</span> The {extension_link} may be required to view removed content when the browser or OS language is not English (see details <a target="_blank" href="https://redd.it/d4wtes">here</a>).
      </div>
    )
  } else {
    return (
      <div className='note highlight real-time desktop-only'>
        The free {extension_link} can <span className='red bubble'>alert</span> you when your content is removed.
      </div>
    )
  }
}
