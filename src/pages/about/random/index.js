import React, {useEffect} from 'react'
import { randomRedditor } from 'api/reddit'
import { connect } from 'state'
import { Spin } from 'components/Misc'

export const Random = (props) => {
  useEffect(() => {
    props.global.setLoading('')
    randomRedditor()
    .then(author => {
      if (author) {
        window.location.href = `/user/${author}/?all=true&sort=top&t=year`
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
