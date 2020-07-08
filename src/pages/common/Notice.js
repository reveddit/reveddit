import React from 'react'

// &#xfe0e; is variation selector-15. allows color to work on iOS
export default ({message = '', htmlLink = '', title = '', className = '', dismissFn = undefined, tooltip = ''}) => {
  return (
    <div className={'notice-with-link ' + className} title={tooltip ? tooltip : false}>
      {dismissFn &&
        <div className='dismiss'>
          <a className='pointer' onClick={dismissFn}>✖&#xfe0e;</a>
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
