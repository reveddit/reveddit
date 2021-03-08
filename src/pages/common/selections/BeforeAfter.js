import React, {useState, useEffect} from 'react'
import { Selection } from './SelectionBase'
import {SimpleURLSearchParams} from 'utils'

const B = 'before', A = 'after'

const beforeAndAfter = [B, A]
const opposite = {[B]: A, [A]: [B]}
const units = { s: 'seconds', m: 'minutes', h: 'hours', d: 'days', w: 'weeks', y: 'years', '': 'timestamp' }

const marginLeft = {marginLeft: '3px'}
const queryParamsOnPageLoad = new SimpleURLSearchParams(window.location.search)
const isSet = queryParamsOnPageLoad.get(B) || queryParamsOnPageLoad.get(A)

const parseNumberAndUnit = (paramValue) => {
  return [
    paramValue.replace(/[a-z]/gi,''),
    paramValue.replace(/[^a-z]/gi,'')
  ]
}

const BeforeAfter = ({...selectionProps}) => {
  const queryParams = new SimpleURLSearchParams(window.location.search)
  const [meta, setMeta] = useState({ beforeOrAfter: B, number: '', unit: 'd' })
  useEffect(() => {
    let beforeOrAfter, number, unit = ''
    const param_b = queryParams.get(B)
    const param_a = queryParams.get(A)
    if (param_b) {
      beforeOrAfter = B;
      [number, unit] = parseNumberAndUnit(param_b)
    } else if (param_a) {
      beforeOrAfter = A;
      [number, unit] = parseNumberAndUnit(param_a)
    }
    if (beforeOrAfter && number) {
      setMeta({beforeOrAfter, number, unit})
    }
  }, [])
  const reset = () => {
    queryParams.delete(B)
    queryParams.delete(A)
    window.location.href = queryParams.toString()
  }
  const onSubmit = (e) => {
    e.preventDefault()
    if (parseInt(meta.number) > 0) {
      queryParams.delete(opposite[meta.beforeOrAfter])
      queryParams.set(meta.beforeOrAfter, meta.number+meta.unit)
      window.location.href = queryParams.toString()
    } else if (isSet && (meta.number == 0 || meta.number == '')) {
      reset()
    }
  }
  const onKeyPress = (e) => {
    if (e.keyCode === 13) {
      onSubmit(e)
    }
  }
  return (
    <Selection className='beforeAfter' isFilter={true} isSet={isSet} {...selectionProps}>
      <form onSubmit={onSubmit}>
        <select value={meta.beforeOrAfter} onChange={(e) => {
          setMeta({...meta, beforeOrAfter: e.target.value})
        }}>
          {beforeAndAfter.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <input type='text' placeholder='0' size={meta.number && meta.number.length > 5 ? meta.number.length-2 : '3'}
               style={{...marginLeft, textAlign:'right'}} value={meta.number}
               onKeyPress={onKeyPress}
               onChange={(e) => {
                 const [number, unit] = parseNumberAndUnit(e.target.value)
                 setMeta({...meta, number, ...(unit && {unit})})
               }}/>
        <div style={{marginTop: '3px'}}>
          <select value={meta.unit} onChange={(e) => {
            setMeta({...meta, unit: e.target.value})
          }}>
            {Object.entries(units).map(([k, v]) => <option key={k} value={k}>{v + (k && ' ago')}</option>)}
          </select>
          <input type='submit' value='go' style={marginLeft} onClick={onSubmit}/>
        </div>
        {isSet && <div style={{textAlign:'center'}}><a className='pointer' onClick={reset}>[x] reset</a></div>}
      </form>
    </Selection>
  )
}

export default BeforeAfter
