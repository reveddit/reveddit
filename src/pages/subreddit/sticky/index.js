import React, {useEffect} from 'react'
import {getSticky} from 'api/reddit'
import {SimpleURLSearchParams} from 'utils'
import {connect} from 'state'

const NUM = 'num'

const SubredditSticky = connect((props) => {
  const { subreddit } = props.match.params
  const {global} = props
  useEffect(() => {
    global.setLoading('')
    const params = new SimpleURLSearchParams(window.location.search)
    getSticky(subreddit, params.get(NUM))
    .then(permalink => {
      if (permalink) {
        params.delete(NUM)
        window.location.href = permalink+params.toString()
      } else {
        global.setError('')
      }
    })
  }, [])
  return <>Redirecting...</>
})

export default SubredditSticky
