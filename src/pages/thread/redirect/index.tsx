import React, { useEffect } from 'react'
import { useGlobalStore } from 'state'
import { getPostWithComments } from 'api/reddit'

export const ThreadRedirect = props => {
  const global = useGlobalStore()
  useEffect(() => {
    global.setLoading('')
    const threadID = props.match.params.threadID
    const cannotRedirect = e => {
      console.error('unable to redirect for post id', threadID)
      if (e) {
        console.error(e)
      }
      global.setError()
    }
    getPostWithComments({ threadID, limit: 0 })
      .catch(_e => getPostWithComments({ threadID, limit: 0, useProxy: true }))
      .then(result => {
        if (result.post) {
          window.location.href =
            result.post.permalink +
            window.location.search +
            window.location.hash
        } else {
          cannotRedirect(result)
        }
      })
      .catch(cannotRedirect)
  }, [])

  return <></>
}

export default ThreadRedirect
