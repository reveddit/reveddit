import React, {useState} from 'react'
import {HelpModal} from 'components/Misc'

// &#xfe0e; is variation selector-15. allows color to work on iOS
export default ({message = '', htmlLink = '', title = '', className = '',
                dismissFn = undefined, detail = '', help = ''}) => {
  const [visibility, setVisibility] = useState('hidden')
  return (
    <div className={'notice-with-link ' + className} title={detail ? detail : undefined} onClick={() => setVisibility('visible')}>
      {dismissFn &&
        <div className='dismiss'>
          <a className='pointer' onClick={dismissFn}>✖&#xfe0e;</a>
        </div>
      }
      <div>
        <span className='title'>{title}</span>{help && <HelpModal title={title} content={help} fill='white'/>}
        {detail &&
          <span className='detail' style={{visibility}}>{detail}</span>
        }
      </div>
      <div className='body' style={title ? {'marginLeft':'10px'} : {}}>
        <div>{message}</div>
        {htmlLink}
      </div>
    </div>
  )
}
