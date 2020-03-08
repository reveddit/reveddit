import React, {useState} from 'react'
import {get, put, usePrevious} from 'utils'

const showRelDates_var = 'showRelativeDatesInThreads'
const showAccountInfo_var = 'showAccountInfo'

export const showRelDates_global = get(showRelDates_var, false)
export const showAccountInfo_global = get(showAccountInfo_var, false)

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

const renderSetting = (checked, onChange, description) => {
  return (
    <label>
      <input type='checkbox' {...{checked, onChange}}/>
      <span>{description}</span>
    </label>
  )
}

export default () => {
  const [showRelDates, update_showRelDates, prev_showRelDates] = getSetting(showRelDates_global, showRelDates_var)
  const [showAccountInfo, update_showAccountInfo, prev_showAccountInfo] = getSetting(showAccountInfo_global, showAccountInfo_var)

  const changes = (     showRelDates !== prev_showRelDates
                  || showAccountInfo !== prev_showAccountInfo)
  return (
    <>
      <div className='header'>Everywhere</div>
      {renderSetting(showAccountInfo, update_showAccountInfo, 'Show account age/karma')}
      <div className='header'>In threads</div>
      {renderSetting(showRelDates, update_showRelDates, 'Show relative dates')}
      <div style={{textAlign:'center',color:'red',marginTop:'15px'}}>
        { changes ?
          'refresh to apply changes' : '\u00A0'}
      </div>
    </>
  )
}
