import React, {useState} from 'react'
import {get, put, usePrevious, CLIENT_ID_SET_BY_USER_VAR_NAME} from 'utils'
import { clearHashFromURL } from 'pages/DefaultLayout'
import { NewWindowLink } from 'components/Misc'
const showRelDates_var = 'showRelativeDatesInThreads'
const showAccountInfo_var = 'showAccountInfo'
const limitCommentDepth_var = 'limitCommentDepth'

export const showRelDates_global = get(showRelDates_var, false)
export const showAccountInfo_global = get(showAccountInfo_var, false)
export const limitCommentDepth_global = get(limitCommentDepth_var, true)

export const API_REGISTRATION_LINK = "https://www.reddit.com/prefs/apps/"

const getSetting = (initValue, varName) => {
  const value_current = initValue
  const [value, set_value] = useState(value_current)
  const prev_value = usePrevious(value)
  const update_value = (e) => {
    put(varName, e.target.checked)
    set_value(e.target.checked)
  }
  return [value, update_value, prev_value]
}

const renderSetting = (checked, onChange, description, name) => {
  return (
    <div>
      <label>
        <input type='checkbox' {...{checked, onChange, name}}/>
        <span>{description}</span>
      </label>
    </div>
  )
}

export const ClientIDForm = () => {
  const handleSubmit = (e) => {
    e.preventDefault()
    const data = new FormData(e.target)
    const clientid = data.get('clientid').trim()
    put(CLIENT_ID_SET_BY_USER_VAR_NAME, clientid)
    clearHashFromURL()
    window.location.reload()
  }
  const handleChange = (e) => {
    const clientid = e.target.value.trim()
    if (clientid === '') {
      put(CLIENT_ID_SET_BY_USER_VAR_NAME, '')
    }
  }
  return (
    <div className='space-around'>
      <form id='user-form' onSubmit={handleSubmit}>
        <label htmlFor='clientid'>Key </label>
        <input id='clientid' onChange={handleChange} type='text' name='clientid' placeholder='app id' autoFocus='autoFocus' defaultValue={get(CLIENT_ID_SET_BY_USER_VAR_NAME, '')}/>
        <input type='submit' id='button_u' value='go' />
      </form>
    </div>
  )
}

export const guideLink = <NewWindowLink reddit='/1502sb3' short>guide</NewWindowLink>
export const api_key_info = <>Follow this {guideLink} to create an API key and enter it here:</>
export default () => {
  const [showRelDates, update_showRelDates, prev_showRelDates] = getSetting(showRelDates_global, showRelDates_var)
  const [showAccountInfo, update_showAccountInfo, prev_showAccountInfo] = getSetting(showAccountInfo_global, showAccountInfo_var)
  const [limitCommentDepth, update_limitCommentDepth, prev_limitCommentDepth] = getSetting(limitCommentDepth_global, limitCommentDepth_var)

  const changes = (     showRelDates !== prev_showRelDates
                  || showAccountInfo !== prev_showAccountInfo
                  || limitCommentDepth !== prev_limitCommentDepth
                  )
  return (
    <>
      <div className='header'>Everywhere</div>
      {renderSetting(showAccountInfo, update_showAccountInfo, 'Show account age/karma', 'showAccountInfo')}
      <div className='header'>In threads</div>
      {renderSetting(limitCommentDepth, update_limitCommentDepth, 'Limit comment depth by default', 'limitCommentDepth')}
      {renderSetting(showRelDates, update_showRelDates, 'Show relative dates', 'showRelDates')}
      <div className='header'>{api_key_info}</div>
      <ClientIDForm/>
      <div style={{textAlign:'center',color:'red',marginTop:'15px'}}>
        { changes ?
          'refresh to apply changes' : '\u00A0'}
      </div>
    </>
  )
}
