import React, {useEffect} from 'react'
import { connect } from 'state'
import {
  getPostWithComments
} from 'api/reddit'

export const ThreadRedirect = (props) => {
  useEffect(() => {
    props.global.setLoading('')
    const threadID = props.match.params.threadID
    const cannotRedirect = (e) => {
      console.error('unable to redirect for post id', threadID)
      if (e) {
        console.error(e)
      }
      props.global.setError()
    }
    getPostWithComments({threadID, limit:0})
    .catch(e => getPostWithComments({threadID, limit:0, useProxy:true}))
    .then(result => {
      if (result.post) {
        window.location.href = result.post.permalink+window.location.search+window.location.hash
      } else {
        cannotRedirect(result)
      }
    })
    .catch(cannotRedirect)
  }, [])

  return (
    <>
    </>
  )
}

export default connect(ThreadRedirect)
