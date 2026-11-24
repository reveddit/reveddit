import React from 'react'
import { Tip } from 'components/Misc'
import {
  ExtensionLink,
  is_iOS,
  iOS_shortcut_link,
} from 'components/ui/Extensions'
import { useExtensionStatus } from 'api/reddit/extensionStatus'

export default ({ showMobile = false }) => {
  // no pitch for what this browser already runs
  if (useExtensionStatus() === 'running') {
    return null
  }
  return (
    <div
      className={`note highlight real-time ${showMobile ? '' : 'desktop-only'}`}
    >
      {is_iOS ? <Tip>{iOS_shortcut_link}</Tip> : <></>}
      <Tip>
        <ExtensionLink /> can notify you when your content is removed.
      </Tip>
    </div>
  )
}
