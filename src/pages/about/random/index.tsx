import React, { useEffect } from 'react'
import { randomRedditor } from 'api/reddit'
import { useGlobalStore } from 'state'
import { Spin } from 'components/Misc'
import { PATH_STR_USER, SimpleURLSearchParams } from 'utils'
import { handleRedditError } from 'components/RevdditFetcher'

export const Random = props => {
  const global = useGlobalStore()
  const subreddit = props.match.params.subreddit || 'all'
  useEffect(() => {
    let isCancelled = false
    global.setLoading('')
    randomRedditor(subreddit)
      .then(author => {
        if (author && !isCancelled) {
          const searchParams = new SimpleURLSearchParams(window.location.search)
          // prev: all=true prev-prev: sort=top,t=year
          if (subreddit !== 'all') {
            searchParams.set('x_subreddit', subreddit)
          }
          // can't use history.push here b/c it won't reset state
          window.location.href =
            `${PATH_STR_USER + '/' + author}/` + searchParams.toString()
        }
      })
      .catch(error => {
        handleRedditError(error, { ...props, global })
      })
    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <>
      <p style={{ textAlign: 'center' }}>
        Searching for a random redditor in r/{subreddit}...
      </p>
      <Spin />
    </>
  )
}

export default Random
