import React, {useState} from 'react'
import {Link} from 'react-router-dom'
import {HelpModal} from 'components/Misc'
import { PATH_STR_USER } from 'utils'

// &#xfe0e; is variation selector-15. allows color to work on iOS
export const Notice = ({message = '', htmlLink = '', title = '', className = '',
                        dismissFn = undefined, detail = '', help = '', tip}) => {
  const [visibility, setVisibility] = useState('hidden')
  const tipBox = tip ? <span className='quarantined'>Tip</span> : null
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
        <div>{tipBox} {message}</div>
        {htmlLink}
      </div>
    </div>
  )
}

export const TipWithBackground = (props) => {
  return <Notice tip={true} {...props}/>
}

export const UserPageTip = () => {
  return <TipWithBackground className='notice-with-link userpage-note'
    message="Check if your account has any removed comments."
    htmlLink={<Link to={PATH_STR_USER+'/'}>view my removed comments</Link>}
  />
}
