import React, {useState, useEffect, useCallback} from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { Selection } from './SelectionBase'
import { urlParamKeys, updateURL } from 'state'

const MIN = 'min', MAX = 'max'

const SUFFIX_MIN = '_'+MIN
const SUFFIX_MAX = '_'+MAX

const TextFilter = ({global, page_type, globalVarName, placeholder, minMax, ...selectionProps }) => {
  const queryParams = new SimpleURLSearchParams(window.location.search)
  let adjusted_globalVarName = globalVarName
  let selectMinDefault = true
  if (queryParams.has(urlParamKeys[globalVarName+SUFFIX_MAX])) {
    selectMinDefault = false
  }
  const [selectMin, setSelectMin] = useState(selectMinDefault)
  let valueFromQueryParam = decodeURIComponent(queryParams.get(urlParamKeys[globalVarName]) || '')
  let suffix = ''
  if (minMax) {
    const suffix = selectMin ? SUFFIX_MIN : SUFFIX_MAX
    const val = queryParams.get(urlParamKeys[globalVarName+suffix]) || ''
    adjusted_globalVarName = globalVarName+suffix
    valueFromQueryParam = val
  }
  const [inputValue, setInputValue] = useState(valueFromQueryParam)
  useEffect(() => {
    const suffix = minMax ?
      selectMin ? SUFFIX_MIN : SUFFIX_MAX
      : ''
    if (global.state[globalVarName+suffix] !== inputValue) {
      debounced_updateStateAndURL(inputValue)
    }
  }, [inputValue, selectMin])
  // when another component updates global state and url param (see: Flair), need this effect to update the input field's shown value
  useEffect(() => {
    setInputValue(valueFromQueryParam)
  }, [valueFromQueryParam])

  const debounced_updateStateAndURL = useCallback(
    debounce(value => {
      let suffix = '', oppSuffix = ''
      if (minMax) {
        suffix = SUFFIX_MIN, oppSuffix = SUFFIX_MAX
        if (! selectMin) {
          suffix = SUFFIX_MAX, oppSuffix = SUFFIX_MIN
        }
        // hack, only allows one filter, min or max, per type (# comments, # subscribers, score)
        const queryParams = new SimpleURLSearchParams(window.location.search)
        queryParams.delete(globalVarName+oppSuffix)
        updateURL(queryParams)
      }
      global.selection_update(globalVarName+suffix, value, page_type)
    }, 500),
    [selectMin]
  )
  let size, select
  if (minMax) {
    size = 7
    select = (
      <select value={selectMin ? MIN : MAX} onChange = {(e) => {
        setSelectMin(e.target.value === MIN)
      }}>
        <option value={MIN}>at least</option>
        <option value={MAX}>at most</option>
      </select>
    )
  }
  return (
    <Selection className='textFilter' isFilter={true} isSet={inputValue.trim().length !== 0} {...selectionProps}>
      {select}
      <input type='text' size={size}
        name={globalVarName+suffix} value={inputValue} placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </Selection>
  )
}

export default connect(TextFilter)
