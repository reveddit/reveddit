import React, {useEffect} from 'react'
import { randomRedditor } from 'api/reddit'
import { connect } from 'state'
import { Spin } from 'components/Misc'
import {PATH_STR_USER} from 'utils'

export const Random = (props) => {
  useEffect(() => {
    props.global.setLoading('')
    randomRedditor()
    .then(author => {
      if (author) {
        window.location.href = `${PATH_STR_USER+'/'+author}/?all=true` // prev: &sort=top&t=year
      }
    })
  }, [])

  return (
    <>
      <p style={{'textAlign':'center'}}>Searching for a random redditor...</p>
      <Spin/>
    </>
  )
}

export default connect(Random)
