import React from 'react'
import { connect, create_qparams_and_adjust } from 'state'
import { SimpleURLSearchParams } from 'utils'

const updateURL = (value) => {
  const queryParams = create_qparams_and_adjust('domain_posts', 'selfposts', value)
  window.location.href = queryParams.toString()
}

const getLink = (include_selfposts, selected) => {
  const selected_class = selected ? 'selected' : ''
  const text = include_selfposts ? 'include' : 'exclude'
  return (
    <div>
      <a className={`${selected_class} pointer`} onClick={() => updateURL(include_selfposts)}>
        {text}
      </a>
    </div>)
}

const Selfposts = (props) => {
  const {selfposts} = props.global.state
  return (
      <div className='selfposts selection'>
        <div className='title'>Selfposts</div>
          {getLink(true, selfposts)}
          {getLink(false, ! selfposts)}
      </div>
  )
}

export default connect(Selfposts)
