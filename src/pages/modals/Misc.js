import React from 'react'
import { NewWindowLink } from 'components/Misc'
import { convertPathSub_reverse } from 'utils'

export const Banned = () => {
  const redditPath = convertPathSub_reverse(window.location.pathname).split('/').slice(0,3).join('/')
  return (
    <>
      <h3>Historical view</h3>
      <p><NewWindowLink reddit={redditPath}>{redditPath}</NewWindowLink> may not exist or has been banned.</p>
      <p>Here is a historical view showing some of the top removed content.</p>
    </>
  )
}
