import React from 'react'

export default ({message, htmlLink}) => {
  return (
    <div className='notice-with-link'>
      <div>{message}</div>
      {htmlLink}
    </div>
  )
}
