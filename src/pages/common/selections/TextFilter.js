import React, {useState, useEffect, useCallback} from 'react'
import { connect } from 'state'
import { SimpleURLSearchParams } from 'utils'
import debounce from 'lodash/debounce'
import { Selection } from './SelectionBase'
import { urlParamKeys } from 'state'

const TextFilter = ({global, page_type, globalVarName, placeholder, ...selectionProps }) => {
  const valueFromQueryParam = decodeURIComponent(new SimpleURLSearchParams(window.location.search).get(urlParamKeys[globalVarName]) || '')
  const [inputValue, setInputValue] = useState(valueFromQueryParam)
  useEffect(() => {
    if (global.state[globalVarName] !== inputValue) {
      debounced_updateStateAndURL(inputValue)
    }
  }, [inputValue])
  // when another component updates global state and url param (see: Flair), need this effect to update the input field's shown value
  useEffect(() => {
    setInputValue(valueFromQueryParam)
  }, [valueFromQueryParam])

  const debounced_updateStateAndURL = useCallback(
    debounce(value => {
      global.selection_update(globalVarName, value, page_type)
    }, 500),
    []
  )

  return (
    <Selection className='textFilter' isFilter={true} isSet={inputValue.trim().length !== 0} {...selectionProps}>
      <input type='text'
        name={globalVarName} value={inputValue} placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </Selection>
  )
}

export default connect(TextFilter)
