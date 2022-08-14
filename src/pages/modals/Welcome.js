import React from 'react'
import BlankUser from 'components/BlankUser'
import {ExtensionLink, SocialLinks } from 'components/Misc'
import Highlight from 'pages/common/Highlight'

export default () => {
  return (
    <>
      <BlankUser message="Did you know Reddit shows users their removed comments as if they are not removed? Check your username's content:"/>
      <div className='space-around desktop-only' style={{paddingTop: '10px'}}>
        <ExtensionLink image={true}/>
      </div>
      <Highlight showMobile={true}/>
      <SocialLinks/>
    </>
  )
}
