import React, {useState, useEffect, useCallback, useRef} from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { Selection } from './SelectionBase'
import { urlParamKeys, updateURL } from 'state'

const MIN = 'min', MAX = 'max'

const SUFFIX_MIN = '_'+MIN
const SUFFIX_MAX = '_'+MAX

const ANY = '"."', ANY_TEXT = 'any'
const NONE = '-"."', NONE_TEXT = 'none'
const EXCLUDE = '-"^\\[(removed|deleted)\\]$"', EXCLUDE_TEXT = 'exclude [removed]'

const associatedValues = {
  [ANY_TEXT]: ANY,
  [NONE_TEXT]: NONE,
  [EXCLUDE_TEXT]: EXCLUDE,
}
const anyNoneOpposite = { any: 'none', none: 'any' }
const marginLeft = {marginLeft:'3px'}
const TextFilter = connect(({global, page_type, globalVarName, placeholder, minMax, anyNone, removeFilter, ...selectionProps }) => {
  const {loading, author_fullnames} = global.state
  const queryParams = new SimpleURLSearchParams(window.location.search)
  let adjusted_globalVarName = globalVarName
  let selectMinDefault = true
  if (queryParams.has(urlParamKeys[globalVarName+SUFFIX_MAX])) {
    selectMinDefault = false
  }
  const [selectMin, setSelectMin] = useState(selectMinDefault)
  const [accountAgeWasSetOnPageLoad, setAccountAgeWasSetOnPageLoad] = useState(false)
  let valueFromQueryParam = decodeURIComponent(queryParams.get(urlParamKeys[globalVarName]) || '')
  let suffix = ''
  if (minMax) {
    const suffix = selectMin ? SUFFIX_MIN : SUFFIX_MAX
    valueFromQueryParam = parseInt(queryParams.get(urlParamKeys[globalVarName+suffix])) || ''
    adjusted_globalVarName = globalVarName+suffix
  }
  const [inputValue, setInputValue] = useState(valueFromQueryParam)
  const [checkedMeta, setCheckedMeta] = useState({})
  const oldSelectMinRef = useRef()
  const is_account_age = globalVarName === 'account_age'
  // check if account age was set on page load
  useEffect(() => {
    if (is_account_age && global.accountAgeQueryParamIsSet()) {
      setAccountAgeWasSetOnPageLoad(true)
    }
  }, [])
  useEffect(() => {
    // make checkbox reflect what's in the text input box
    for (const [text, associatedValue] of Object.entries(associatedValues)) {
      const isChecked = checkedMeta[text]
      if (inputValue === associatedValue && ! isChecked) {
        setCheckedMeta({[text]: true, [anyNoneOpposite]: false})
        break
      } else if (inputValue !== associatedValue && isChecked) {
        setCheckedMeta({[text]: false})
      }
    }
  }, [inputValue])
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
  let size, select, checkboxes, inputsClass = ''
  const Checkbox = ({text}) => {
    return (
      <label title={text}>
        <input type='checkbox' checked={checkedMeta[text]} value={text} onChange={
          (e) => {
            const newVal = ! checkedMeta[text]
            setCheckedMeta({
              [anyNoneOpposite[text]]: false,
              [text]: newVal
            })
            if (newVal) {
              setInputValue(associatedValues[text])
            } else if (inputValue === associatedValues[text]) {
              setInputValue('')
            }
          }
        }/>
        <span>{text}</span>
      </label>
    )
  }
  if (minMax) {
    size = 6
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
    checkboxes = <div><Checkbox text={ANY_TEXT}/> <Checkbox text={NONE_TEXT}/></div>
  } else if (['thread', 'subreddit_comments', 'search', 'info'].includes(page_type) && selectionProps.title.match(/body/i)) {
    checkboxes = <div><Checkbox text={EXCLUDE_TEXT}/></div>
    inputsClass = 'below'
  }
  return (
    <Selection className='textFilter' isFilter={true} isSet={inputValue.toString().trim().length !== 0} {...selectionProps}>
      <div className={'inputs '+inputsClass}>
        {select}
        <input type='text' size={size}
          name={globalVarName+suffix} value={inputValue} placeholder={placeholder}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {minMax && <span className='pointer' onClick={() => {
          removeFilter()
          if (inputValue) {
            updateStateAndURL('')
          }
        }} style={marginLeft}>x</span>}
        {is_account_age
         && inputValue !== ''
         && ! accountAgeWasSetOnPageLoad
         && Object.keys(author_fullnames).length === 0
         && <button onClick={() => window.location.reload()} style={marginLeft}>go</button>
        }
        {checkboxes}
      </div>
    </Selection>
  )
})


export const FlairFilter = (props) => {
  return <TextFilter anyNone={true} {...props}/>
}

export default TextFilter
