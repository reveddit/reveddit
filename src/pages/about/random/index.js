import React, {useEffect} from 'react'
import { useHistory } from 'react-router-dom'
import { randomRedditor } from 'api/reddit'
import { connect } from 'state'
import { Spin } from 'components/Misc'
import {PATH_STR_USER} from 'utils'

export const Random = (props) => {
  const subreddit = props.match.params.subreddit || 'all'
  const history = useHistory()
  useEffect(() => {
    let isCancelled = false
    props.global.setLoading('')
    randomRedditor(subreddit)
    .then(author => {
      if (author && ! isCancelled) {
        const sub_param = subreddit !== 'all' ? `&x_subreddit=${subreddit}` : ''
        // can't use history.push here b/c it won't reset state
        window.location.href = `${PATH_STR_USER+'/'+author}/?all=true${sub_param}` // prev: &sort=top&t=year
      }
    })
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <>
      <p style={{'textAlign':'center'}}>Searching for a random redditor in r/{subreddit}...</p>
      <Spin/>
    </>
  )
}

export default connect(Random)
