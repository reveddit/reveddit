import React from 'react'

export default ({message, htmlLink = '', title = ''}) => {
  return (
    <div className='notice-with-link'>
      <div className='title'>{title}</div>
      <div style={title ? {'marginLeft':'10px'} : {}}>
        <div>{message}</div>
        {htmlLink}
      </div>
    </div>
  )
}
