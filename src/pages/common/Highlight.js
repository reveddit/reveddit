import React from 'react'
import {ext_urls} from 'utils'
import {Tip, ExtensionLink, is_iOS, iOS_shortcut_link} from 'components/Misc'

export default ({showMobile = false}) => {
  return (
    <div className={`note highlight real-time ${showMobile ? '' : 'desktop-only'}`}>
      {is_iOS ? <Tip>{iOS_shortcut_link}</Tip> : <></>}
      <Tip><ExtensionLink/> can notify you when your content is removed.</Tip>
    </div>
  )
}
