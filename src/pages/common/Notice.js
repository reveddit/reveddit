import React from 'react'

export default ({message, htmlLink = '', title = '', className = '', dismissFn = undefined}) => {
  return (
    <div className={'notice-with-link ' + className}>
      {dismissFn &&
        <div className='dismiss'>
          <a className='pointer' onClick={dismissFn}>✖</a>
        </div>
      }
      <div className='title'>{title}</div>
      <div className='body' style={title ? {'marginLeft':'10px'} : {}}>
        <div>{message}</div>
        {htmlLink}
      </div>
    </div>
  )
}
