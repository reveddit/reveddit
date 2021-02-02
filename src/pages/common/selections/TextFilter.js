import React, {useState, useEffect, useCallback, useRef} from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { Selection } from './SelectionBase'
import { urlParamKeys, updateURL } from 'state'

const MIN = 'min', MAX = 'max'

const SUFFIX_MIN = '_'+MIN
const SUFFIX_MAX = '_'+MAX

const ANY = '"."'
const NONE = '-"."'
const anyNoneOpposite = { any: 'none', none: 'any' }

const TextFilter = connect(({global, page_type, globalVarName, placeholder, minMax, anyNone, ...selectionProps }) => {
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
    valueFromQueryParam = parseInt(queryParams.get(urlParamKeys[globalVarName+suffix])) || ''
    adjusted_globalVarName = globalVarName+suffix
  }
  const [inputValue, setInputValue] = useState(valueFromQueryParam)
  const [anyNoneChecked, setAnyNoneChecked] = useState({
    any: false,
    none: false,
  })
  const oldSelectMinRef = useRef()
  useEffect(() => {
    if (anyNone) {
      const value = global.state[globalVarName]
      if (value === ANY) {
        setAnyNoneChecked({any: true})
      } else if (value === NONE) {
        setAnyNoneChecked({none: true})
      }
    }
  }, [])
  useEffect(() => {
    const oldSelectMin = oldSelectMinRef.current
    oldSelectMinRef.current = selectMin
    const suffix = minMax ?
      selectMin ? SUFFIX_MIN : SUFFIX_MAX
      : ''
    // change state quickly when the drop down changes,
    // slowly when text input changes
    if (oldSelectMin !== selectMin) {
      updateStateAndURL(inputValue)
    } else if (global.state[globalVarName+suffix] !== inputValue) {
      debounced_updateStateAndURL(inputValue)
    }
  }, [inputValue, selectMin])
  // when another component updates global state and url param (see: Flair), need this effect to update the input field's shown value
  useEffect(() => {
    setInputValue(valueFromQueryParam)
  }, [valueFromQueryParam])
  const updateStateAndURL = useCallback(
    (value) => {
      let suffix = '', oppSuffix = ''
      if (minMax) {
        suffix = SUFFIX_MIN, oppSuffix = SUFFIX_MAX
        if (! selectMin) {
          suffix = SUFFIX_MAX, oppSuffix = SUFFIX_MIN
        }
        // hack, only allows one filter, min or max, per type (# comments, # subscribers, score)
        // to allow both min and max, add 'between' dropdown option and make another text box appear when that's selected
        const queryParams = new SimpleURLSearchParams(window.location.search)
        queryParams.delete(globalVarName+oppSuffix)
        updateURL(queryParams)
      }
      // when hiding/showing filters, this condition updates
      // global state only when the value has changed rather than every first render
      if (global.state[globalVarName+suffix] !== value) {
        // don't need to update global state for oppSuffix b/c this function
        // automatically sets state according to URL's query params
        global.selection_update(globalVarName+suffix, value, page_type)
      }
    }, [selectMin]
  )
  const debounced_updateStateAndURL = useCallback(
    debounce(updateStateAndURL, 500),
    [selectMin]
  )
  let size, select, checkboxes
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
  } else if (anyNone) {
    size = 8
    const Checkbox = ({text}) => {
      return (
        <label title={text}>
          <input type='checkbox' checked={anyNoneChecked[text]} value={text} onChange={
            (e) => {
              const newVal = ! anyNoneChecked[text]
              setAnyNoneChecked({
                [anyNoneOpposite[text]]: false,
                [text]: newVal
              })
              if (newVal) {
                if (text === 'any') {
                  setInputValue(ANY)
                } else {
                  setInputValue(NONE)
                }
              } else if ((inputValue === ANY && text === 'any') ||
                         (inputValue === NONE && text === 'none')) {
                setInputValue('')
              }
            }
          }/>
          <span>{text}</span>
        </label>
      )
    }
    checkboxes = <div><Checkbox text='any'/> <Checkbox text='none'/></div>
  }
  return (
    <Selection className='textFilter' isFilter={true} isSet={inputValue.toString().trim().length !== 0} {...selectionProps}>
      <div className='inputs'>
        {select}
        <input type='text' size={size}
          name={globalVarName+suffix} value={inputValue} placeholder={placeholder}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {checkboxes}
      </div>
    </Selection>
  )
})


export const FlairFilter = (props) => {
  return <TextFilter anyNone={true} {...props}/>
}

export default TextFilter
