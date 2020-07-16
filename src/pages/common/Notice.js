import React from 'react'

// &#xfe0e; is variation selector-15. allows color to work on iOS
export default ({message = '', htmlLink = '', title = '', className = '',
                dismissFn = undefined, detail = ''}) => {
  let onClick = () => {}
  if (detail) {
    onClick = (e) => {e.currentTarget.querySelector('.detail').style.visibility = 'visible'}
  }
  return (
    <div className={'notice-with-link ' + className} title={detail ? detail : undefined} onClick={onClick}>
      {dismissFn &&
        <div className='dismiss'>
          <a className='pointer' onClick={dismissFn}>✖&#xfe0e;</a>
        </div>
      }
      <div>
        <span className='title'>{title}</span>
        {detail &&
          <span className='detail' style={{visibility:'hidden'}}>{detail}</span>
        }
      </div>
      <div className='body' style={title ? {'marginLeft':'10px'} : {}}>
        <div>{message}</div>
        {htmlLink}
      </div>
    </div>
  )
}
