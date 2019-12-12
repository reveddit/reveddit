import React from 'react'
import {ext_urls} from 'utils'

export default () => {
  return (
    <>
      <p>Welcome! To receive a notification when your content is removed, install the <a href={ext_urls.rt.c}>Chrome</a> or <a href={ext_urls.rt.f}>Firefox</a> extension.</p>
      <p>This message can be re-opened by clicking <i>welcome</i> at the top of any page.</p>
    </>
  )
}
