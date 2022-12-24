import React, {useState, useEffect, useRef, useLayoutEffect} from 'react'
import { Selection } from './SelectionBase'
import {SimpleURLSearchParams,
        unitInSeconds, parseDateISOString, convertToEpoch, DATE_UNIT,
        parseNumberAndUnit,
} from 'utils'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import { useIsMobile } from 'hooks/mobile'
import { usePrevious } from 'hooks/previous'

const B = 'before', A = 'after'

const beforeAndAfter = [B, A]
const opposite = {[B]: A, [A]: [B]}
const TIMESTAMP_UNIT = ''
const units = { [DATE_UNIT]: 'date', [TIMESTAMP_UNIT]: 'timestamp', s: 'seconds', m: 'minutes', h: 'hours', d: 'days', w: 'weeks', M: 'months', y: 'years' }

const marginLeft = {marginLeft: '3px'}
const queryParamsOnPageLoad = new SimpleURLSearchParams(window.location.search)
const valueOnPageLoad = queryParamsOnPageLoad.get(B) || queryParamsOnPageLoad.get(A)

const validUnit = (u) => u in units

const inputLooksLikeDate = (s) => s.match(DATE_UNIT) || s.match(/[./]/)
const pxPerChar = 8.875
const defaultNumChars = 8
const defaultPxWidth = pxPerChar*defaultNumChars
// from https://itnext.io/reusing-the-ref-from-forwardref-with-react-hooks-4ce9df693dd
function useCombinedRefs(ref) {
  const targetRef = useRef()
  useEffect(() => {
    if (!ref) return

    if (typeof ref === 'function') {
      ref(targetRef.current)
    } else {
      ref.current = targetRef.current
    }
  }, [ref])

  return targetRef
}

const CustomOverlay = React.forwardRef(({classNames, selectedDay, children, ...props}, ref) => {
  const combinedRef = useCombinedRefs(ref)
  const [marginLeft, setMarginLeft] = useState(0)
  useLayoutEffect(() => {
    const rect = combinedRef.current.getBoundingClientRect()
    const widthOfRightNotVisible = rect.right - document.documentElement.clientWidth
    if (widthOfRightNotVisible > 0 && rect.left - widthOfRightNotVisible > 0 ) {
      setMarginLeft(-widthOfRightNotVisible)
    }
  }, [ref])
  return (
    <div className={classNames.overlayWrapper} {...props}>
      <div className={classNames.overlay} ref={combinedRef} style={{marginLeft}}>
        {children}
      </div>
    </div>
  )
})

const zpad_time = (t) => ('0'+t).slice(-2)

const convertEpochToDateString = (epoch) => {
  const d = new Date(0)
  d.setUTCSeconds(epoch)
  const ymd_string = [
    d.getFullYear(),
    d.getMonth()+1,
    d.getDate()].join('-')
  const [hours, mins, seconds] = [d.getHours(), d.getMinutes(), d.getSeconds()]
  let time_string = ''
  if (hours || mins || seconds) {
    const times = [hours, mins]
    if (seconds) times.push(seconds)
    time_string = ' '+times.map(zpad_time).join(':')
  }
  return ymd_string + time_string
}

const getDefaults = () => {
  let beforeOrAfter = B, number = '', unit = DATE_UNIT
  const param_b = queryParamsOnPageLoad.get(B)
  const param_a = queryParamsOnPageLoad.get(A)
  if (param_b) {
    beforeOrAfter = B;
    [number, unit] = parseNumberAndUnit(param_b)
  } else if (param_a) {
    beforeOrAfter = A;
    [number, unit] = parseNumberAndUnit(param_a)
  }
  if (beforeOrAfter && number) {
    if (number.match(/^\d{10,}$/) && unit === TIMESTAMP_UNIT) {
      number = convertEpochToDateString(number)
      unit = DATE_UNIT
    }
  }
  return {beforeOrAfter, number, unit}
}

const BeforeAfter = ({...selectionProps}) => {
  const queryParams = new SimpleURLSearchParams(window.location.search)
  const [meta, setMeta] = useState(getDefaults())
  const prevMeta = usePrevious(meta)
  const dayPickerRef = useRef(null)
  const agoInputRef = useRef(null)
  const overlayRef = useRef(null)
  const isMobile = useIsMobile()
  const reset = () => {
    queryParams.delete(B)
    queryParams.delete(A)
    window.location.href = queryParams.toString()
  }
  const onSubmit = (e) => {
    e.preventDefault()
    if (parseInt(meta.number) > 0) {
      queryParams.delete(opposite[meta.beforeOrAfter])
      queryParams.set(meta.beforeOrAfter, convertToEpoch(meta.number,meta.unit))
      window.location.href = queryParams.toString()
    } else if (valueOnPageLoad && (meta.number == 0 || meta.number == '')) {
      reset()
    }
  }
  const onKeyPress = (e) => {
    if (e.keyCode === 13) {
      onSubmit(e)
    }
  }
  const sharedInputProps = {
    style: {
      ...marginLeft, textAlign:'right',
      width: Math.ceil(
        meta.number && meta.number.length > defaultNumChars ? meta.number.length*pxPerChar : defaultPxWidth
      ).toString()+'px',
    },
    onKeyPress,
  }
  useEffect(() => {
    if (prevMeta && prevMeta.unit !== DATE_UNIT && meta.unit === DATE_UNIT) {
      dayPickerRef.current.input.focus()
    } else if (meta.unit in unitInSeconds || meta.unit === '') {
      agoInputRef.current.focus()
    }
  }, [meta.number, meta.unit])

  return (
    <Selection className='beforeAfter' isFilter={true} isSet={valueOnPageLoad} {...selectionProps}>
      <form onSubmit={onSubmit}>
        <select value={meta.beforeOrAfter} onChange={(e) => {
          setMeta({...meta, beforeOrAfter: e.target.value})
        }}>
          {beforeAndAfter.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        {meta.unit !== DATE_UNIT ?
          <input type='text' placeholder='0' value={meta.number} ref={agoInputRef}
                 onChange={(e) => {
                   let [number, unit] = parseNumberAndUnit(e.target.value)
                   if (inputLooksLikeDate(number)) {
                     unit = DATE_UNIT
                   }
                   if (validUnit(unit)) {
                     setMeta({...meta, number, ...(unit && {unit})})
                   }
                 }}
                 {...sharedInputProps}
           />
        :
          <DayPickerInput value={meta.number} ref={dayPickerRef}
            onDayChange={(day, modifiers, dayPickerInput) => {
              const value = dayPickerInput.getInput().value
              let [number, unit] = parseNumberAndUnit(value)
              if (! unit) {
                number = value
              } else if (inputLooksLikeDate(value)) {
                unit = DATE_UNIT
              }
              setMeta({...meta, number, ...(unit && {unit})})
            }}
            overlayComponent={props => <CustomOverlay {...props} ref={overlayRef}/>}
            parseDate={parseDateISOString}
            inputProps={{
              ...sharedInputProps,
              readOnly: isMobile,
              placeholder: 'Y-m-d',
            }}
          />
        }
        <div style={{marginTop: '3px'}}>
          <select value={meta.unit} onChange={(e) => {
            // reset value when changing b/w date and any other unit
            const number = [meta.unit, e.target.value].includes(DATE_UNIT) ? '' : meta.number
            setMeta({...meta, number, unit: e.target.value})
          }}>
            {Object.entries(units).map(([k, v]) => <option key={k} value={k}>{v + (k in unitInSeconds ? ' ago':'')}</option>)}
          </select>
          <input type='submit' value='go' style={marginLeft} onClick={onSubmit}/>
        </div>
        {valueOnPageLoad && <div style={{textAlign:'center'}}><a className='pointer' onClick={reset}>[x] reset</a></div>}
      </form>
    </Selection>
  )
}

export default BeforeAfter
