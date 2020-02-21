import React, {useEffect} from 'react'
import { connect } from 'state'
import {
  getItems
} from 'api/reddit'

export const ThreadRedirect = (props) => {
  useEffect(() => {
    props.global.setLoading('')
    getItems([`t3_${props.match.params.threadID}`])
    .then(posts => {
      const post = Object.values(posts)[0]
      if (post) {
        window.location.href = post.permalink+window.location.search+window.location.hash
      } else {
        props.global.setError('')
      }
    })
  }, [])

  return (
    <>
    </>
  )
}

export default connect(ThreadRedirect)
